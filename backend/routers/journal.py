import uuid
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..db.database import get_connection

router = APIRouter(prefix="/api", tags=["journal"])


class EventCreate(BaseModel):
    event_type: str
    title: str
    body: str
    metadata: Optional[dict] = None


@router.get("/samples/{sample_id}/journal")
def get_journal(sample_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM fit_events WHERE sample_id = ? ORDER BY created_at ASC",
        (sample_id,)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        e = dict(r)
        e["metadata"] = json.loads(e["metadata"]) if e.get("metadata") else None
        result.append(e)
    return result


@router.post("/samples/{sample_id}/journal/event")
def add_event(sample_id: str, body: EventCreate):
    conn = get_connection()
    # verify sample exists
    s = conn.execute("SELECT id FROM samples WHERE id = ?", (sample_id,)).fetchone()
    if not s:
        conn.close()
        raise HTTPException(404, "Sample not found")
    eid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO fit_events (id, sample_id, event_type, title, body, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        (eid, sample_id, body.event_type, body.title, body.body,
         json.dumps(body.metadata) if body.metadata else None)
    )
    conn.commit()
    conn.close()
    return {"id": eid}


@router.post("/samples/{sample_id}/fits/{fit_id}/select-for-report")
def select_for_report(sample_id: str, fit_id: str):
    conn = get_connection()
    # Deselect all fits for this sample
    conn.execute(
        "UPDATE model_fits SET selected_for_report = 0 WHERE sample_id = ?",
        (sample_id,)
    )
    # Select this fit
    conn.execute(
        "UPDATE model_fits SET selected_for_report = 1 WHERE id = ? AND sample_id = ?",
        (fit_id, sample_id)
    )
    conn.commit()
    conn.close()
    return {"ok": True}
