# Start both backend and frontend dev servers
# Run this file with: powershell -ExecutionPolicy Bypass -File start-dev.ps1

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting AI-Powered Caries Detection Development Environment" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Start Backend
Write-Host "`n[1] Starting Backend on port 5000..." -ForegroundColor Yellow
$BackendProcess = Start-Process -FilePath "C:/Users/SQ/AppData/Local/Programs/Python/Python312/python.exe" `
  -ArgumentList "app.py" `
  -WorkingDirectory "$ProjectRoot\Backend" `
  -NoNewWindow `
  -PassThru

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2] Starting Frontend on port 5173..." -ForegroundColor Yellow
$FrontendProcess = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/k cd `"$ProjectRoot\Frontend`" && npm run dev" `
  -NoNewWindow `
  -PassThru

Write-Host "`n✅ Both servers started!" -ForegroundColor Green
Write-Host "   Backend:  http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress any key to stop all servers..." -ForegroundColor Gray

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping servers..." -ForegroundColor Yellow
Stop-Process -InputObject $BackendProcess -Force
Stop-Process -InputObject $FrontendProcess -Force
Write-Host "✅ All servers stopped." -ForegroundColor Green
