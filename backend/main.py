import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
from .db.database import create_tables
from .routers.projects import router as projects_router
from .routers.samples import router as samples_router, obs_router
from .routers.fitting import router as fitting_router
from .routers.excel import router as excel_router
from .routers.journal import router as journal_router
from .routers.report import router as report_router
from .routers.experiments import router as experiments_router
from .routers.quick_import import router as quick_import_router

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
app.include_router(experiments_router)
app.include_router(quick_import_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
