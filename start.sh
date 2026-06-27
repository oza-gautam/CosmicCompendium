#!/bin/bash
echo "============================================"
echo " Disinfection Benchmark Modeling Workbench"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python 3 not found."
    echo "Install from https://www.python.org/downloads/"
    exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found."
    echo "Install from https://nodejs.org/en/download"
    exit 1
fi

# Setup backend venv if needed
if [ ! -f "backend/.venv/bin/activate" ]; then
    echo "Setting up Python environment (first time only)..."
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies (first time only)..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "Starting backend..."
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo " Open browser to: http://localhost:3000"
echo " Press Ctrl+C to stop"
echo "============================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
