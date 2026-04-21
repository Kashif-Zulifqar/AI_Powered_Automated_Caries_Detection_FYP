from pathlib import Path

import numpy as np
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"

if not MODEL_PATH.exists():
	raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


def classify_image(image_bgr: np.ndarray) -> dict:
	"""Run the detector and summarize whether any caries regions were found."""
	results = model.predict(source=image_bgr, verbose=False)
	confidences: list[float] = []
	for result in results:
		boxes = getattr(result, "boxes", None)
		if boxes is None or boxes.conf is None:
			continue
		confidences.extend(float(score) for score in boxes.conf.cpu().numpy())

	issue_probability = max(confidences, default=0.0)
	label = "Caries Detected" if confidences else "Healthy"
	confidence = issue_probability if confidences else 1.0 - issue_probability

	return {
		"label": label,
		"issueProbability": round(issue_probability, 4),
		"confidence": round(confidence, 4),
	}
