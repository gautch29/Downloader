import json
from datetime import datetime, timezone
from pathlib import Path


def append_job_event(log_path: Path, event: str, job_id: str, payload: dict[str, object]) -> None:
    line = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "job_id": job_id,
        "payload": payload,
    }
    with open(log_path, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(line, ensure_ascii=True) + "\n")
