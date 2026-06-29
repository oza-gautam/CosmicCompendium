@echo off
echo =========================================
echo  Disinfection Workbench — Setup (Windows)
echo =========================================
echo.

:: Backend
echo [1/3] Setting up Python backend...
cd backend
python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt
cd ..
echo Backend ready.
echo.

:: Frontend
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo Frontend ready.
echo.

echo [3/3] Setup complete!
echo.
echo To start the app, run:
echo   start-backend.bat   (in one terminal)
echo   start-frontend.bat  (in another terminal)
echo.
pause
