// A tiny Metta-inspired rule engine with unification and backward-chaining queries
// The goal is to provide a declarative layer to express scheduling preferences as rules.

export type AtomicValue = string | number | boolean | null

export type Term =
  | { kind: "var"; name: string }
  | { kind: "sym"; value: string }
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "nil" }

export type Clause = {
  predicate: string
  args: Term[]
}

export type Fact = Clause

export type Rule = {
  head: Clause
  body: Clause[]
  description?: string
}

export type Substitution = Record<string, Term>

export function variable(name: string): Term {
  if (!name.startsWith("?")) name = `?${name}`
  return { kind: "var", name }
}

export function sym(value: string): Term {
  return { kind: "sym", value }
}

export function str(value: string): Term {
  return { kind: "str", value }
}

export function num(value: number): Term {
  return { kind: "num", value }
}

export function bool(value: boolean): Term {
  return { kind: "bool", value }
}

export function nil(): Term {
  return { kind: "nil" }
}

function isVariable(t: Term): t is { kind: "var"; name: string } {
  return t.kind === "var"
}

function termsEqual(a: Term, b: Term): boolean {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case "var":
      return (a as any).name === (b as any).name
    case "sym":
    case "str":
      return (a as any).value === (b as any).value
    case "num":
      return (a as any).value === (b as any).value
    case "bool":
      return (a as any).value === (b as any).value
    case "nil":
      return true
  }
}

function applySubstToTerm(term: Term, subst: Substitution): Term {
  if (isVariable(term) && subst[term.name]) {
    return applySubstToTerm(subst[term.name], subst)
  }
  return term
}

function occursCheck(v: string, t: Term, subst: Substitution): boolean {
  const term = applySubstToTerm(t, subst)
  if (isVariable(term)) return term.name === v
  return false
}

export function unify(a: Term, b: Term, subst: Substitution): Substitution | null {
  const t1 = applySubstToTerm(a, subst)
  const t2 = applySubstToTerm(b, subst)

  if (isVariable(t1)) {
    if (isVariable(t2) && t1.name === t2.name) return subst
    if (occursCheck(t1.name, t2, subst)) return null
    return { ...subst, [t1.name]: t2 }
  }

  if (isVariable(t2)) {
    if (occursCheck(t2.name, t1, subst)) return null
    return { ...subst, [t2.name]: t1 }
  }

  if (termsEqual(t1, t2)) return subst
  return null
}

export function unifyClauses(pattern: Clause, target: Clause, subst: Substitution): Substitution | null {
  if (pattern.predicate !== target.predicate) return null
  if (pattern.args.length !== target.args.length) return null
  let s: Substitution = { ...subst }
  for (let i = 0; i < pattern.args.length; i++) {
    const next = unify(pattern.args[i], target.args[i], s)
    if (!next) return null
    s = next
  }
  return s
}

export class KnowledgeBase {
  private facts: Fact[] = []
  private rules: Rule[] = []

  addFact(predicate: string, ...args: Term[]): void {
    this.facts.push({ predicate, args })
  }

  addRule(rule: Rule): void {
    this.rules.push(rule)
  }

  getFacts(): Fact[] {
    return this.facts
  }

  getRules(): Rule[] {
    return this.rules
  }

  query(goal: Clause): Substitution[] {
    const results: Substitution[] = []
    const visited = new Set<string>()

    const proveAll = (goals: Clause[], subst: Substitution) => {
      if (goals.length === 0) {
        const key = JSON.stringify(subst)
        if (!visited.has(key)) {
          visited.add(key)
          results.push(subst)
        }
        return
      }
      const [first, ...rest] = goals
      // Try matching facts
      for (const fact of this.facts) {
        const s = unifyClauses(first, fact, subst)
        if (s) proveAll(rest, s)
      }
      // Try applying rules
      for (const rule of this.rules) {
        const s = unifyClauses(first, rule.head, subst)
        if (s) {
          proveAll([...rule.body, ...rest], s)
        }
      }
    }

    proveAll([goal], {})
    return results
  }
}

// Convenience builders for domain facts without verbose term constructors
export const t = {
  v: variable,
  s: sym,
  n: num,
  str,
  b: bool,
  nil,
}

export function clause(predicate: string, ...args: Term[]): Clause {
  return { predicate, args }
}

