from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import create_tables
from .routers.projects import router as projects_router
from .routers.samples import router as samples_router, obs_router
from .routers.fitting import router as fitting_router
from .routers.excel import router as excel_router
from .routers.journal import router as journal_router
from .routers.report import router as report_router

app = FastAPI(title="Disinfection Benchmark Workbench API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()


app.include_router(projects_router)
app.include_router(samples_router)
app.include_router(obs_router)
app.include_router(fitting_router)
app.include_router(excel_router)
app.include_router(journal_router)
app.include_router(report_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
