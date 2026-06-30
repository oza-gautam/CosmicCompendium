# Installation Guide â€” Disinfection Benchmark Modeling Workbench

## Prerequisites

Install these once on your machine before anything else.

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11 | https://www.python.org/downloads/ |
| Node.js | 20 LTS | https://nodejs.org/ |
| Git | any | https://git-scm.com/ |

> **Windows tip:** During Python install, check **"Add Python to PATH"** before clicking Install.

---

## Step 1 â€” Get the code

Open a terminal (VS Code: `Ctrl+`` ` or **Terminal â†’ New Terminal**) and run:

```bash
git clone https://github.com/oza-gautam/CosmicCompendium.git disinfection
cd disinfection
```

---

## Step 2 â€” Open in VS Code

```bash
code .
```

When VS Code opens, install the recommended extensions if prompted (Python, ESLint).

---

## Step 3 â€” Set up the backend (Python)

In the VS Code terminal:

```bash
cd backend
python -m venv .venv
```

**Activate the virtual environment:**

- Windows (Git Bash): `source .venv/Scripts/activate`
- Mac/Linux: `source .venv/bin/activate`

You should see `(.venv)` at the start of your prompt. Then install dependencies:

```bash
pip install -r requirements.txt
```

---

## Step 4 â€” Set up the frontend (Node.js)

Open a **second terminal** in VS Code (`+` button in the terminal panel), then:

```bash
cd frontend
npm install
```

---

## Step 5 â€” Start the app

You need **two terminals running at the same time.**

**Terminal 1 â€” Backend:**

**Windows (Git Bash):**
```bash
source ./.venv/Scripts/activate
uvicorn backend.main:app --reload --port 8000 >> logs/backend.log 2>&1
```

**Mac/Linux:**
```bash
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000 >> logs/backend.log 2>&1
```

**Terminal 2 â€” Frontend:**

```bash
cd frontend
npm run dev >> ../logs/frontend.log 2>&1
```

> **Note:** Run all commands from the **project root** (`~/workspace/disinfection`). Logs go to `logs/backend.log` and `logs/frontend.log`. Create the folder first if it doesn't exist:
> ```bash
> mkdir -p logs
> ```

---

## Step 6 â€” Open in your browser

Go to: **http://localhost:3025**

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
| Port 3000 already in use | Run `npm run dev -- --port 3026` and open http://localhost:3026 |
| Port 8000 already in use | Run `uvicorn backend.main:app --reload --port 8001` and update the frontend API URL in `.env.local` |
| `ModuleNotFoundError` | Make sure `(.venv)` is shown in the terminal before running uvicorn |
