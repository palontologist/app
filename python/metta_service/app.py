import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

try:
    # hyperon provides MeTTa evaluation environment
    from hyperon import MeTTa
except Exception as e:  # pragma: no cover - service starts even if hyperon missing
    MeTTa = None  # type: ignore


class TaskIn(BaseModel):
    id: int
    title: str
    priority: int = 0  # higher is more important
    deadline: Optional[str] = None  # ISO date string
    depends_on: List[int] = []


class ScheduleRequest(BaseModel):
    tasks: List[TaskIn]


class ScheduleItem(BaseModel):
    id: int
    title: str
    order: int


class ScheduleResponse(BaseModel):
    order: List[ScheduleItem]
    reason: str


app = FastAPI(title="Metta Scheduler Service")


def build_metta_program(tasks: List[TaskIn]) -> str:
    # Represent tasks as MeTTa facts with attributes; simple normalized atoms
    lines = []
    lines.append(";; Tasks with attributes: (task <id> <priority> <deadline_ts>)")
    for t in tasks:
        ts = 0
        if t.deadline:
            try:
                ts = int(datetime.fromisoformat(t.deadline).timestamp())
            except Exception:
                ts = 0
        lines.append(f"(task {t.id} {t.priority} {ts})")
    lines.append(";; Dependencies: (dep <a> <b>) means a depends on b")
    for t in tasks:
        for d in t.depends_on:
            lines.append(f"(dep {t.id} {d})")

    # Core rules: ready if no unmet deps
    lines += [
        ";; A task is ready if all its deps are scheduled",
        "(= (ready $t $scheduled)",
        "   (if (all_deps_satisfied $t $scheduled) true false))",
        "",
        ";; all_deps_satisfied checks all (dep t d) are in scheduled set",
        "(= (all_deps_satisfied $t $scheduled)",
        "   (if (no_deps $t) true (deps_in_set $t $scheduled)))",
        "(= (no_deps $t) (not (dep $t $x)))",
        "",
        ";; deps_in_set holds when for every dependency d, (member d scheduled)",
        "(= (deps_in_set $t $scheduled)",
        "   (if (exists_dep_not_in $t $scheduled) false true))",
        "(= (exists_dep_not_in $t $scheduled)",
        "   (and (dep $t $d) (not (member $d $scheduled))))",
        "",
        ";; List membership helpers",
        "(= (member $x (cons $x $xs)) true)",
        "(= (member $x (cons $y $ys)) (member $x $ys))",
        "(= (member $x nil) false)",
        "",
        ";; pick_best among ready tasks uses priority desc, then earliest deadline",
        "(= (score $t) (+ (* 100 (priority_of $t)) (- 1000000000 (deadline_of $t))))",
        "(= (priority_of $t) (value (task $t $p $dl) $p))",
        "(= (deadline_of $t) (value (task $t $p $dl) $dl))",
        "(= (value $expr $res) $res)",
        "",
        ";; select next task: among candidates C, choose with max score",
        "(= (argmax $best $cands)",
        "   (if (null $cands) nil (argmax_impl (head $cands) (tail $cands))))",
        "(= (argmax_impl $cur nil) $cur)",
        "(= (argmax_impl $cur (cons $x $xs))",
        "   (if (> (score $x) (score $cur))",
        "       (argmax_impl $x $xs)",
        "       (argmax_impl $cur $xs)))",
        "",
        ";; list helpers",
        "(= (head (cons $h $t)) $h)",
        "(= (tail (cons $h $t)) $t)",
        "(= (null nil) true)",
        "(= (null (cons $h $t)) false)",
        "",
        ";; filter ready and not-yet scheduled",
        "(= (filter_ready $remaining $scheduled $out)",
        "   (if (null $remaining)",
        "       $out",
        "       (if (and (not (member (head $remaining) $scheduled))",
        "                (ready (head $remaining) $scheduled))",
        "           (filter_ready (tail $remaining) $scheduled (cons (head $remaining) $out))",
        "           (filter_ready (tail $remaining) $scheduled $out))))",
        "",
        ";; produce schedule by iteratively appending best ready task",
        "(= (schedule_all $tasks $scheduled $result)",
        "   (if (null $tasks)",
        "       (reverse $scheduled)",
        "       (let $ready (filter_ready $tasks $scheduled nil)",
        "            (if (null $ready)",
        "                (reverse $scheduled)",
        "                (let $next (argmax (head $ready) (tail $ready))",
        "                     (schedule_all (remove $tasks $next) (cons $next $scheduled) $result))))))",
        "",
        "(= (remove nil $x) nil)",
        "(= (remove (cons $h $t) $x) (if (= $h $x) $t (cons $h (remove $t $x))))",
        "(= (reverse $l) (rev_impl $l nil))",
        "(= (rev_impl nil $acc) $acc)",
        "(= (rev_impl (cons $h $t) $acc) (rev_impl $t (cons $h $acc)))",
    ]

    return "\n".join(lines)


def run_schedule(tasks: List[TaskIn]): List[int]:
    if MeTTa is None:
        # Fallback: simple topological sort by deps, tie-break by priority desc then earliest deadline
        from collections import defaultdict, deque
        indeg = defaultdict(int)
        graph = defaultdict(list)
        pr = {t.id: t.priority for t in tasks}
        dl = {t.id: int(datetime.fromisoformat(t.deadline).timestamp()) if t.deadline else 1_000_000_000 for t in tasks}
        ids = set([t.id for t in tasks])
        for t in tasks:
            for d in t.depends_on:
                graph[d].append(t.id)
                indeg[t.id] += 1
        q = [i for i in ids if indeg[i] == 0]
        order = []
        while q:
            q.sort(key=lambda x: (-pr.get(x, 0), dl.get(x, 1_000_000_000)))
            u = q.pop(0)
            order.append(u)
            for v in graph[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        # if cycle, append remaining by priority
        if len(order) < len(ids):
            rest = list(ids - set(order))
            rest.sort(key=lambda x: (-pr.get(x, 0), dl.get(x, 1_000_000_000)))
            order.extend(rest)
        return order

    program = build_metta_program(tasks)
    m = MeTTa()
    m.run(program)

    # Build list of task ids in MeTTa list form: (cons id (cons ... nil))
    ids_sorted = sorted([t.id for t in tasks])
    lst_expr = "nil"
    for tid in reversed(ids_sorted):
        lst_expr = f"(cons {tid} {lst_expr})"

    result = m.run(f"(schedule_all {lst_expr} nil nil)")
    # result is a MeTTa atom; convert by traversing cons
    def to_list(atom) -> List[int]:  # type: ignore
        try:
            # hyperon atoms likely have .to_str() but we keep generic parsing via run
            # Re-run helper to decompose list
            items = []
            cur = atom
            # best-effort string conversion
            s = str(cur)
            # naive parse: count integers in order
            return [int(x) for x in s.replace("(", " ").replace(")", " ").split() if x.isdigit()]
        except Exception:
            return []

    arr = []
    for a in result:
        arr.extend(to_list(a))
    # Deduplicate while preserving order
    seen = set()
    out = []
    for x in arr:
        if x not in seen:
            out.append(x)
            seen.add(x)
    return out


@app.post("/schedule", response_model=ScheduleResponse)
def schedule(req: ScheduleRequest):
    ids = run_schedule(req.tasks)
    order = []
    rank = {tid: i for i, tid in enumerate(ids)}
    for t in req.tasks:
        order.append(ScheduleItem(id=t.id, title=t.title, order=rank.get(t.id, 10_000)))
    order.sort(key=lambda x: x.order)
    return ScheduleResponse(order=order, reason="MeTTa-based scheduling with deps, deadlines, priorities")

