import uuid
import json
import io
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from ..db.database import get_connection
from pydantic import BaseModel
from typing import Optional as Opt
from ..schemas import SampleOut, ObservationOut, ColumnMapRequest, UpdateRowsRequest
from ..science.ict_engine import compute_ict

router = APIRouter(prefix="/api/projects/{project_id}/samples", tags=["samples"])
obs_router = APIRouter(prefix="/api/samples", tags=["samples"])

COMMON_COLUMN_ALIASES = {
    "time": ["time", "minutes", "time_min", "time (min)", "time(min)"],
    "concentration": ["concentration", "conc", "disinfectant", "residual", "mg/l", "mg/ml"],
    "cfu": ["cfu", "colony", "count", "organisms", "coliforms", "microorganism", "e. coli", "log n"],
    "ict": ["ict", "integrated ct", "integrated contact"],
    "replicate": ["replicate", "rep"],
    "dose": ["dose", "uv dose"],
}


def _detect_columns(columns: list[str]) -> dict:
    cols_lower = {c: c.lower().strip() for c in columns}
    result = {}
    for field, aliases in COMMON_COLUMN_ALIASES.items():
        for col, col_l in cols_lower.items():
            if any(alias in col_l for alias in aliases):
                result[field] = col
                break
    return result


@router.post("", response_model=SampleOut)
async def upload_sample(
    project_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
):
    conn = get_connection()
    proj = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        raise HTTPException(404, "Project not found")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        conn.close()
        raise HTTPException(400, f"Failed to parse CSV: {e}")

    sample_name = name or file.filename or "Sample"
    column_map = _detect_columns(list(df.columns))

    sample_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO samples (id, project_id, name, raw_csv, column_map) VALUES (?, ?, ?, ?, ?)",
        (sample_id, project_id, sample_name, content.decode("utf-8", errors="replace"), json.dumps(column_map)),
    )

    time_col = column_map.get("time")
    conc_col = column_map.get("concentration")
    cfu_col = column_map.get("cfu")

    if time_col and conc_col and cfu_col:
        df_clean = df[[time_col, conc_col, cfu_col]].dropna()
        times = df_clean[time_col].tolist()
        concs = df_clean[conc_col].tolist()
        cfus = df_clean[cfu_col].tolist()

        ict_col = column_map.get("ict")
        if ict_col and ict_col in df.columns:
            icts = df_clean[ict_col].tolist() if ict_col in df_clean.columns else compute_ict(times, concs)
        else:
            icts = compute_ict(times, concs)

        repl_col = column_map.get("replicate")
        repls = df_clean[repl_col].tolist() if repl_col and repl_col in df_clean.columns else [None] * len(times)

        for i, (t, c, cfu, ict, repl) in enumerate(zip(times, concs, cfus, icts, repls)):
            conn.execute(
                "INSERT INTO observations (sample_id, time, concentration, cfu, ict, replicate, row_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (sample_id, float(t), float(c), float(cfu), float(ict), str(repl) if repl else None, i),
            )

    conn.commit()
    obs_count = conn.execute("SELECT COUNT(*) FROM observations WHERE sample_id = ?", (sample_id,)).fetchone()[0]

    # Write journal event
    conn.execute(
        "INSERT INTO fit_events (id, sample_id, event_type, title, body, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), sample_id, "sample_created",
         f"Sample imported: {sample_name}",
         f"Sample '{sample_name}' imported from CSV with {obs_count} observations.",
         json.dumps({"obs_count": obs_count, "source": "csv"}))
    )
    conn.commit()

    sample_row = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,)).fetchone()
    conn.close()

    s = dict(sample_row)
    s["column_map"] = json.loads(s["column_map"]) if s["column_map"] else {}
    s["observation_count"] = obs_count
    return s


@router.get("", response_model=list[SampleOut])
def list_samples(project_id: str):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM samples WHERE project_id = ? ORDER BY created_at", (project_id,)).fetchall()
    result = []
    for r in rows:
        s = dict(r)
        s["column_map"] = json.loads(s["column_map"]) if s["column_map"] else {}
        count = conn.execute("SELECT COUNT(*) FROM observations WHERE sample_id = ?", (r["id"],)).fetchone()[0]
        s["observation_count"] = count
        result.append(s)
    conn.close()
    return result


@obs_router.get("/{sample_id}/data", response_model=list[ObservationOut])
def get_observations(sample_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM observations WHERE sample_id = ? ORDER BY time", (sample_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@obs_router.post("/{sample_id}/column-map")
def update_column_map(sample_id: str, body: ColumnMapRequest):
    conn = get_connection()
    sample = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,)).fetchone()
    if not sample:
        conn.close()
        raise HTTPException(404, "Sample not found")

    raw_csv = sample["raw_csv"]
    try:
        df = pd.read_csv(io.StringIO(raw_csv))
    except Exception as e:
        conn.close()
        raise HTTPException(400, str(e))

    cm = body.column_map
    conn.execute("DELETE FROM observations WHERE sample_id = ?", (sample_id,))

    time_col = cm.get("time")
    conc_col = cm.get("concentration")
    cfu_col = cm.get("cfu")

    if time_col and conc_col and cfu_col:
        df_clean = df[[time_col, conc_col, cfu_col]].dropna()
        times = df_clean[time_col].tolist()
        concs = df_clean[conc_col].tolist()
        cfus = df_clean[cfu_col].tolist()
        ict_col = cm.get("ict")
        icts = df[ict_col].tolist() if ict_col and ict_col in df.columns else compute_ict(times, concs)
        for i, (t, c, cfu, ict) in enumerate(zip(times, concs, cfus, icts)):
            conn.execute(
                "INSERT INTO observations (sample_id, time, concentration, cfu, ict, row_index) VALUES (?, ?, ?, ?, ?, ?)",
                (sample_id, float(t), float(c), float(cfu), float(ict), i),
            )

    conn.execute("UPDATE samples SET column_map = ? WHERE id = ?", (json.dumps(cm), sample_id))
    conn.commit()
    conn.close()
    return {"ok": True}


@obs_router.put("/{sample_id}/rows")
def update_rows(sample_id: str, body: UpdateRowsRequest):
    conn = get_connection()
    if not conn.execute("SELECT 1 FROM samples WHERE id = ?", (sample_id,)).fetchone():
        conn.close()
        raise HTTPException(404, "Sample not found")
    times = [r.time for r in body.rows]
    concs = [r.concentration for r in body.rows]
    cfus = [r.cfu for r in body.rows]
    icts = compute_ict(times, concs)
    conn.execute("DELETE FROM observations WHERE sample_id = ?", (sample_id,))
    for i, (t, c, cfu, ict) in enumerate(zip(times, concs, cfus, icts)):
        conn.execute(
            "INSERT INTO observations (sample_id, time, concentration, cfu, ict, row_index) VALUES (?, ?, ?, ?, ?, ?)",
            (sample_id, t, c, cfu, ict, i),
        )
    conn.commit()
    conn.close()
    return {"ok": True}


class SamplePatch(BaseModel):
    experiment_id: Opt[int] = None


@obs_router.patch("/{sample_id}", response_model=SampleOut)
def patch_sample(sample_id: str, body: SamplePatch):
    conn = get_connection()
    row = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Sample not found")
    conn.execute(
        "UPDATE samples SET experiment_id = ? WHERE id = ?",
        (body.experiment_id, sample_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,)).fetchone()
    s = dict(row)
    s["column_map"] = json.loads(s["column_map"]) if s["column_map"] else {}
    s["observation_count"] = conn.execute(
        "SELECT COUNT(*) FROM observations WHERE sample_id = ?", (sample_id,)
    ).fetchone()[0]
    conn.close()
    return s


@obs_router.get("/{sample_id}/detect-columns")
def detect_columns(sample_id: str):
    conn = get_connection()
    sample = conn.execute("SELECT raw_csv FROM samples WHERE id = ?", (sample_id,)).fetchone()
    conn.close()
    if not sample:
        raise HTTPException(404, "Sample not found")
    try:
        df = pd.read_csv(io.StringIO(sample["raw_csv"]))
        detected = _detect_columns(list(df.columns))
        return {"columns": list(df.columns), "detected": detected}
    except Exception as e:
        raise HTTPException(400, str(e))
