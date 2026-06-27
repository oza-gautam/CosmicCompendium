import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "disinfection.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_tables():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS samples (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            raw_csv TEXT,
            column_map TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sample_id TEXT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
            time REAL NOT NULL,
            concentration REAL NOT NULL,
            cfu REAL NOT NULL,
            ict REAL,
            replicate TEXT,
            dose REAL,
            temperature REAL,
            ph REAL,
            row_index INTEGER
        );

        CREATE TABLE IF NOT EXISTS model_fits (
            id TEXT PRIMARY KEY,
            sample_id TEXT NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
            model_id TEXT NOT NULL,
            parameters TEXT NOT NULL,
            statistics TEXT NOT NULL,
            diagnostics TEXT NOT NULL,
            quality_score TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS import_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            column_map TEXT NOT NULL,
            group_column TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
