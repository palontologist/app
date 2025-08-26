# Metta Scheduler Service (Python)

- FastAPI wrapper around MeTTa (via hyperon) to compute a task order respecting dependencies, deadlines, and priorities.

## Setup

```
cd python/metta_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

If hyperon is not available on your platform, the service falls back to a deterministic topological + priority/deadline scheduler.

## API

POST /schedule
```
{
  "tasks": [
    {"id": 1, "title": "A", "priority": 2, "deadline": "2025-09-01", "depends_on": [3]},
    {"id": 2, "title": "B", "priority": 1, "deadline": "2025-08-30", "depends_on": []},
    {"id": 3, "title": "C", "priority": 3, "deadline": null, "depends_on": []}
  ]
}
```
Response:
```
{
  "order": [
    {"id": 3, "title": "C", "order": 0},
    {"id": 1, "title": "A", "order": 1},
    {"id": 2, "title": "B", "order": 2}
  ],
  "reason": "MeTTa-based scheduling with deps, deadlines, priorities"
}
```