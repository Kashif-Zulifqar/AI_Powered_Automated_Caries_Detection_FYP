# Start backend with virtual environment Python and dependency check
# This ensures all AI dependencies are available

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "Backend"
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

Write-Host ""
Write-Host "Starting Backend with AI Dependencies..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $VenvPython)) {
    Write-Host "ERROR: Virtual environment not found at $VenvPython" -ForegroundColor Red
    Write-Host "Please ensure the .venv folder exists in the project root" -ForegroundColor Red
    exit 1
}

Write-Host "Using Python: $VenvPython" -ForegroundColor Yellow
Write-Host ""

# Run dependency check
Push-Location $BackendDir
& $VenvPython check_dependencies.py

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Dependencies check failed!" -ForegroundColor Red
    Write-Host "Please ensure all AI packages are installed in the virtual environment" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Starting Flask backend on http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Start the app
& $VenvPython app.py

Pop-Location
