# Disinfection Benchmark Modeling Workbench

A scientific web application for water treatment researchers to fit microbial inactivation models to experimental disinfection data.

---

## Requirements

- Python 3.11 or higher — https://www.python.org/downloads/
- Node.js 18 or higher — https://nodejs.org/en/download

No other accounts, licenses, or cloud services required.

---

## First-time Setup

### 1. Backend (Python / FastAPI)

Open a terminal in the `backend/` folder:

```bash
cd backend
python -m venv .venv
```

**Windows:**
```
.venv\Scripts\activate
pip install -r requirements.txt
```

**Mac/Linux:**
```
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend (Next.js)

Open a second terminal in the `frontend/` folder:

```bash
cd frontend
npm install
```

---

## Running the App

You need two terminals open simultaneously.

**Terminal 1 — Backend:**

```bash
cd backend

# Windows
.venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Mac/Linux
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Then open your browser at: **http://localhost:3000**

---

## Stopping the App

Press `Ctrl+C` in each terminal.

---

## Folder Structure

```
disinfection/
├── backend/          Python FastAPI server + science engine
│   ├── main.py
│   ├── requirements.txt
│   ├── science/      Fitting engine, models, statistics
│   ├── routers/      API endpoints
│   └── db/           SQLite database (auto-created on first run)
├── frontend/         Next.js web interface
│   ├── src/
│   └── package.json
└── README.md
```

---

## Supported Models

- Traditional CT
- First-Order ICT
- Chick-Watson
- Hom Model
- Weibull
- Biphasic
- Two-Population ICT

---

## Data Format

Upload CSV files with at minimum these columns (exact names or common variants):

| Column | Example names |
|--------|--------------|
| Time | `Time (min)`, `time`, `minutes` |
| Disinfectant concentration | `Disinfectant concentration (mg/L)`, `concentration`, `conc` |
| Microbial count | `E. coli (CFU/100 mL)`, `CFU`, `count` |

The app auto-detects column names.
