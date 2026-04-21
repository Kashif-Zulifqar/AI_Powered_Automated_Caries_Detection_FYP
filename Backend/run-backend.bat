@echo off
REM Start backend with virtual environment Python
REM This ensures all AI dependencies are available

cd /d "%~dp0Backend"

echo.
echo Starting Backend with AI Dependencies...
echo ===============================================
echo.

REM Use the venv Python
set VENV_PYTHON=..\\.venv\\Scripts\\python.exe

if not exist "%VENV_PYTHON%" (
    echo ERROR: Virtual environment not found at %VENV_PYTHON%
    echo Please ensure the .venv folder exists in the project root
    exit /b 1
)

echo Using Python: %VENV_PYTHON%
echo.

%VENV_PYTHON% check_dependencies.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Dependencies check failed!
    echo Please ensure all AI packages are installed in the virtual environment
    pause
    exit /b 1
)

echo.
echo ===============================================
echo Starting Flask backend on http://127.0.0.1:5000
echo ===============================================
echo.

%VENV_PYTHON% app.py
