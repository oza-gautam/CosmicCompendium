import uuid
from fastapi import APIRouter, HTTPException
from ..db.database import get_connection
from ..schemas import ProjectCreate, ProjectOut

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_project(body: ProjectCreate):
    project_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO projects (id, name, description) VALUES (?, ?, ?)",
        (project_id, body.name, body.description),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    return dict(row)


@router.get("", response_model=list[ProjectOut])
def list_projects():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Project not found")
    return dict(row)


@router.delete("/{project_id}")
def delete_project(project_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
