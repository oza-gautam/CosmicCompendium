# Installation Guide — Disinfection Benchmark Modeling Workbench

## Prerequisites

Install these once on your machine before anything else.

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11 | https://www.python.org/downloads/ |
| Node.js | 20 LTS | https://nodejs.org/ |
| Git | any | https://git-scm.com/ |

> **Windows tip:** During Python install, check **"Add Python to PATH"** before clicking Install.

---

## Step 1 — Get the code

Open a terminal (VS Code: `Ctrl+`` ` or **Terminal → New Terminal**) and run:

```bash
git clone <repo-url> disinfection
cd disinfection
```

Replace `<repo-url>` with the URL or path you were given.

---

## Step 2 — Open in VS Code

```bash
code .
```

When VS Code opens, install the recommended extensions if prompted (Python, ESLint).

---

## Step 3 — Set up the backend (Python)

In the VS Code terminal:

```bash
cd backend
python -m venv .venv
```

**Activate the virtual environment:**

- Windows: `.venv\Scripts\activate`
- Mac/Linux: `source .venv/bin/activate`

You should see `(.venv)` at the start of your prompt. Then install dependencies:

```bash
pip install -r requirements.txt
```

---

## Step 4 — Set up the frontend (Node.js)

Open a **second terminal** in VS Code (`+` button in the terminal panel), then:

```bash
cd frontend
npm install
```

---

## Step 5 — Start the app

You need **two terminals running at the same time.**

**Terminal 1 — Backend:**

```bash
cd backend
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

---

## Step 6 — Open in your browser

Go to: **http://localhost:3000**

The app is ready when you see the workbench home page.

---

## Stopping the app

Press `Ctrl+C` in each terminal to stop the backend and frontend servers.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python` not found | Re-install Python with "Add to PATH" checked, then reopen VS Code |
| `npm` not found | Re-install Node.js, then reopen VS Code |
| Port 3000 already in use | Run `npm run dev -- --port 3001` and open http://localhost:3001 |
| Port 8000 already in use | Run `uvicorn main:app --reload --port 8001` and update the frontend API URL in `.env.local` |
| `ModuleNotFoundError` | Make sure `(.venv)` is shown in the terminal before running uvicorn |
