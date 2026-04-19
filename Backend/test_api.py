import io
import json

import numpy as np
from PIL import Image

from app import create_app
from db import users
from utils import hash_otp, plus_minutes


class _ArrayWrapper:
	def __init__(self, arr):
		self._arr = arr

	def cpu(self):
		return self

	def numpy(self):
		return self._arr


class _Boxes:
	def __init__(self):
		self.xyxy = _ArrayWrapper(np.array([[1, 1, 8, 8]], dtype=float))
		self.conf = _ArrayWrapper(np.array([0.82], dtype=float))


class _FakeResult:
	def __init__(self):
		self.boxes = _Boxes()


def _fake_model(_img):
	return [_FakeResult()]


def _build_test_image_bytes():
	image = Image.new("RGB", (12, 12), color=(160, 180, 200))
	buffer = io.BytesIO()
	image.save(buffer, format="JPEG")
	buffer.seek(0)
	return buffer.getvalue()


def _get_auth_token(client, email):
	otp_plain = "123456"
	users.update_one(
		{"email": email},
		{
			"$set": {
				"email": email,
				"name": "API Tester",
				"emailVerified": False,
				"otpHash": hash_otp(otp_plain),
				"otpExpires": plus_minutes(10),
			}
		},
		upsert=True,
	)

	client.post(
		"/auth/register-complete",
		data=json.dumps(
			{
				"email": email,
				"otp": otp_plain,
				"password": "pass1234",
				"confirmPassword": "pass1234",
			}
		),
		content_type="application/json",
	)

	resp = client.post(
		"/auth/login",
		data=json.dumps({"email": email, "password": "pass1234"}),
		content_type="application/json",
	)
	payload = resp.get_json() or {}
	token = payload.get("token")
	if not token:
		raise RuntimeError(f"Could not obtain auth token. Response: {payload}")
	return token


def run_test():
	app = create_app()
	client = app.test_client()

	# Keep the upload test deterministic and fast.
	import model_loader

	model_loader.model = _fake_model

	token = _get_auth_token(client, "api_tester@example.com")
	image_bytes = _build_test_image_bytes()

	resp = client.post(
		"/api/upload",
		data={"image": (io.BytesIO(image_bytes), "test.jpg")},
		content_type="multipart/form-data",
		headers={"Authorization": f"Bearer {token}"},
	)
	payload = resp.get_json() or {}
	if resp.status_code != 201:
		raise RuntimeError(f"Upload failed: {resp.status_code} {payload}")

	report_db_id = payload.get("reportDbId")
	if not report_db_id:
		raise RuntimeError(f"Missing reportDbId in upload response: {payload}")

	pdf_resp = client.get(
		f"/api/reports/{report_db_id}/pdf",
		headers={"Authorization": f"Bearer {token}"},
	)
	if pdf_resp.status_code != 200:
		raise RuntimeError(
			f"PDF download failed: {pdf_resp.status_code} {pdf_resp.get_data(as_text=True)[:300]}"
		)

	content_type = pdf_resp.headers.get("Content-Type", "")
	if "application/pdf" not in content_type:
		raise RuntimeError(f"Unexpected PDF content type: {content_type}")

	print("upload:", resp.status_code, payload)
	print("pdf:", pdf_resp.status_code, content_type)


if __name__ == "__main__":
	run_test()