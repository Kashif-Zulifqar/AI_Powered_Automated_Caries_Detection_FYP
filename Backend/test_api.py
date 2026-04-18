from pathlib import Path
import requests

url = "http://127.0.0.1:5000/api/predict"
image_path = Path(__file__).with_name("test.jpg")

if not image_path.exists():
	raise FileNotFoundError(f"Test image not found: {image_path}")

with image_path.open("rb") as image_file:
	files = {"image": image_file}
	res = requests.post(url, files=files, timeout=60)

print(f"Status: {res.status_code}")

try:
	print(res.json())
except ValueError:
	print("Non-JSON response received:")
	print(res.text[:500])