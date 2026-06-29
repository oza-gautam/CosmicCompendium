#!/bin/bash
echo "========================================="
echo " Disinfection Workbench — Setup (Mac/Linux)"
echo "========================================="
echo

echo "[1/3] Setting up Python backend..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
echo "Backend ready."
echo

echo "[2/3] Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "Frontend ready."
echo

echo "[3/3] Setup complete!"
echo
echo "To start the app:"
echo "  Terminal 1: cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "  Terminal 2: cd frontend && npm run dev"
echo
