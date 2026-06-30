import json
from fastapi import APIRouter, HTTPException
from ..db.database import get_connection
from ..schemas import (
    ExperimentCreate, ExperimentUpdate, ExperimentOut,
    ExperimentFitCreate, ExperimentFitOut, SampleOut, ExperimentMetadata,
)

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


def _row_to_experiment(row: dict, conn) -> dict:
    meta_raw = row.get("metadata")
    meta = json.loads(meta_raw) if meta_raw else None

    counts = conn.execute(
        "SELECT COUNT(*) FROM samples WHERE experiment_id = ?", (row["id"],)
    ).fetchone()[0]

    last_fit = conn.execute(
        "SELECT label, created_at FROM experiment_fits WHERE experiment_id = ? ORDER BY created_at DESC LIMIT 1",
        (row["id"],),
    ).fetchone()

    return {
        **dict(row),
        "metadata": meta,
        "sample_count": counts,
        "last_fit_label": last_fit["label"] if last_fit else None,
        "last_fit_at": last_fit["created_at"] if last_fit else None,
    }


@router.post("", response_model=ExperimentOut)
def create_experiment(body: ExperimentCreate):
    conn = get_connection()
    project = conn.execute("SELECT id FROM projects WHERE id = ?", (body.project_id,)).fetchone()
    if not project:
        conn.close()
        raise HTTPException(404, "Project not found")

    meta_json = body.metadata.model_dump_json() if body.metadata else None
    cur = conn.execute(
        "INSERT INTO experiments (project_id, name, metadata) VALUES (?, ?, ?)",
        (body.project_id, body.name, meta_json),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM experiments WHERE id = ?", (cur.lastrowid,)).fetchone()
    result = _row_to_experiment(dict(row), conn)
    conn.close()
    return result


@router.get("", response_model=list[ExperimentOut])
def list_experiments(project_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM experiments WHERE project_id = ? ORDER BY created_at DESC",
        (project_id,),
    ).fetchall()
    result = [_row_to_experiment(dict(r), conn) for r in rows]
    conn.close()
    return result


@router.get("/{eid}", response_model=ExperimentOut)
def get_experiment(eid: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM experiments WHERE id = ?", (eid,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Experiment not found")
    result = _row_to_experiment(dict(row), conn)
    conn.close()
    return result


@router.patch("/{eid}", response_model=ExperimentOut)
def update_experiment(eid: int, body: ExperimentUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM experiments WHERE id = ?", (eid,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Experiment not found")

    current = dict(row)
    new_name = body.name if body.name is not None else current["name"]
    if body.metadata is not None:
        new_meta = body.metadata.model_dump_json()
    else:
        new_meta = current.get("metadata")

    conn.execute(
        "UPDATE experiments SET name = ?, metadata = ? WHERE id = ?",
        (new_name, new_meta, eid),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM experiments WHERE id = ?", (eid,)).fetchone()
    result = _row_to_experiment(dict(row), conn)
    conn.close()
    return result


@router.delete("/{eid}")
def delete_experiment(eid: int):
    conn = get_connection()
    conn.execute("DELETE FROM experiments WHERE id = ?", (eid,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/{eid}/samples", response_model=list[SampleOut])
def list_experiment_samples(eid: int):
    conn = get_connection()
    experiment = conn.execute("SELECT id FROM experiments WHERE id = ?", (eid,)).fetchone()
    if not experiment:
        conn.close()
        raise HTTPException(404, "Experiment not found")

    rows = conn.execute(
        "SELECT * FROM samples WHERE experiment_id = ? ORDER BY created_at ASC",
        (eid,),
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        col_map = json.loads(d["column_map"]) if d.get("column_map") else None
        d["column_map"] = col_map
        count = conn.execute(
            "SELECT COUNT(*) FROM observations WHERE sample_id = ?", (d["id"],)
        ).fetchone()[0]
        d["observation_count"] = count
        result.append(d)
    conn.close()
    return result


@router.post("/{eid}/fits", response_model=ExperimentFitOut)
def save_experiment_fit(eid: int, body: ExperimentFitCreate):
    conn = get_connection()
    experiment = conn.execute("SELECT id FROM experiments WHERE id = ?", (eid,)).fetchone()
    if not experiment:
        conn.close()
        raise HTTPException(404, "Experiment not found")

    params_json = json.dumps(body.parameters)
    cur = conn.execute(
        "INSERT INTO experiment_fits (experiment_id, label, parameters) VALUES (?, ?, ?)",
        (eid, body.label, params_json),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM experiment_fits WHERE id = ?", (cur.lastrowid,)).fetchone()
    d = dict(row)
    d["parameters"] = json.loads(d["parameters"])
    conn.close()
    return d


@router.get("/{eid}/fits", response_model=list[ExperimentFitOut])
def list_experiment_fits(eid: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM experiment_fits WHERE experiment_id = ? ORDER BY created_at DESC",
        (eid,),
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["parameters"] = json.loads(d["parameters"])
        result.append(d)
    conn.close()
    return result
