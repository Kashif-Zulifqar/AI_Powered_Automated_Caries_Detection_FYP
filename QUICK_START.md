# Quick Start Guide — AI-Powered Caries Detection FYP

## Prerequisites
- Python 3.12 configured (verified ✓)
- Node.js + npm (for frontend)
- MongoDB Atlas connection in `Backend/.env` (verified ✓)
- All dependencies installed

## Running the Application

### Option 1: Use the Automated Script (Recommended)
```powershell
cd "F:\Final Year Project\AI_Powered_Automated_Caries_Detection_FYP"
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```
This starts both backend (port 5000) and frontend (port 5173) in separate windows.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 — Backend Server (port 5000):**
```powershell
cd "F:\Final Year Project\AI_Powered_Automated_Caries_Detection_FYP\Backend"
C:/Users/SQ/AppData/Local/Programs/Python/Python312/python.exe app.py
```

Wait for: `* Running on http://127.0.0.1:5000`

**Terminal 2 — Frontend Dev Server (port 5173):**
```powershell
cd "F:\Final Year Project\AI_Powered_Automated_Caries_Detection_FYP\Frontend"
npm run dev
```

Wait for output showing frontend URL (usually `http://localhost:5173`)

## Accessing the Application

Open your browser to: **http://localhost:5173**

The frontend proxy automatically routes API calls to the backend.

## Troubleshooting

### "500 Internal Server Error" on upload
- Check Backend console for actual error details
- Ensure both servers are running (see above)

### "Cannot connect to MongoDB"
- Verify MONGO_URI in Backend/.env is valid
- Check your network connection (MongoDB Atlas may be IP-restricted)

### "Module not found" errors
- Run: `C:/Users/SQ/AppData/Local/Programs/Python/Python312/python.exe -m pip install -r Backend/requirements.txt`
- Or for frontend: `cd Frontend && npm install`

### Port 5000 or 5173 already in use
- Check what process is using the port and kill it
- Or modify port in Backend/app.py (line 66) or Frontend/vite.config.js (line 7)

## Key Directories

- **Backend**: `Backend/` — Flask API, model loader, DB queries
- **Frontend**: `Frontend/src/` — React components, pages, authentication
- **Model**: `Backend/best.pt` — YOLOv8 caries detection model
- **Reports**: `Backend/generated_reports/` — Generated PDF reports
