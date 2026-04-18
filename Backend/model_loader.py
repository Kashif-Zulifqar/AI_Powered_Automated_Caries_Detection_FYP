from pathlib import Path

from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"

if not MODEL_PATH.exists():
	raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))