@echo off
echo ============================================
echo  Disinfection Benchmark Modeling Workbench
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found.
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found.
    echo Please install Node.js 18+ from https://nodejs.org/en/download
    pause
    exit /b 1
)

REM Setup backend venv if not already done
if not exist "backend\.venv\Scripts\activate.bat" (
    echo Setting up Python environment (first time only)...
    cd backend
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Install frontend deps if not already done
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies (first time only)...
    cd frontend
    npm install
    cd ..
)

echo.
echo Starting backend server...
start "Backend - API Server" cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "Frontend - Web App" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  App is starting...
echo  Open your browser to: http://localhost:3000
echo  (wait 10-15 seconds for first load)
echo ============================================
echo.
echo Close the two terminal windows to stop the app.
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3000
