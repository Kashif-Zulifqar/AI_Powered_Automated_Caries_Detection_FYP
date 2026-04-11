"""
DentalAI — Protected API Routes
=================================
All routes require JWT authentication via ``@login_required``.
Every database query is scoped to ``g.current_user["email"]``
so users can only access their own data.
"""

from flask import Blueprint, request, jsonify, g
from db import users, scans
from middleware import login_required
from bson import ObjectId
from datetime import datetime
import random
import logging
from flask import Blueprint, request, jsonify
import numpy as np
import cv2
from model_loader import model

api = Blueprint("api", __name__, url_prefix="/api")
log = logging.getLogger("dentalai.api")


# ─── Dashboard Stats ─────────────────────────────────────────────────────────

@api.get("/dashboard-stats")
@login_required
def dashboard_stats():
    """Aggregated dashboard statistics — scoped to the authenticated user."""
    email = g.current_user["email"]

    user_scans = list(scans.find(
        {"user_email": email},
        {"_id": 1, "date": 1, "confidence": 1, "severity": 1},
    ).sort("date", -1))

    total = len(user_scans)

    # Average confidence
    avg_confidence = 0
    if total > 0:
        avg_confidence = round(
            sum(s.get("confidence", 0) for s in user_scans) / total
        )

    # Count this month
    now = datetime.utcnow()
    this_month = sum(
        1 for s in user_scans
        if isinstance(s.get("date"), datetime)
        and s["date"].month == now.month
        and s["date"].year == now.year
    )

    # Most recent 3
    recent = []
    for s in user_scans[:3]:
        d = s.get("date", now)
        recent.append({
            "id": str(s["_id"]),
            "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
            "confidence": s.get("confidence", 0),
            "severity": s.get("severity", "Unknown"),
        })

    return jsonify({
        "totalScans": total,
        "avgConfidence": avg_confidence,
        "thisMonth": this_month,
        "recentReports": recent,
    }), 200


# ─── Reports List ────────────────────────────────────────────────────────────

@api.get("/reports")
@login_required
def get_reports():
    """All reports for the authenticated user, newest first."""
    email = g.current_user["email"]

    user_reports = list(scans.find(
        {"user_email": email},
    ).sort("date", -1))

    reports = []
    for r in user_reports:
        d = r.get("date", datetime.utcnow())
        reports.append({
            "id": str(r["_id"]),
            "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
            "confidence": r.get("confidence", 0),
            "severity": r.get("severity", "Unknown"),
            "status": r.get("status", "Completed"),
            "findings": r.get("findings", ""),
        })

    return jsonify({"reports": reports}), 200


# ─── Single Report ───────────────────────────────────────────────────────────

@api.get("/reports/<report_id>")
@login_required
def get_report(report_id):
    """Single report detail — verified to belong to the authenticated user."""
    email = g.current_user["email"]

    try:
        oid = ObjectId(report_id)
    except Exception:
        return jsonify({"error": "Invalid report ID"}), 400

    report = scans.find_one({"_id": oid, "user_email": email})
    if not report:
        return jsonify({"error": "Report not found"}), 404

    d = report.get("date", datetime.utcnow())
    return jsonify({
        "id": str(report["_id"]),
        "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
        "confidence": report.get("confidence", 0),
        "severity": report.get("severity", "Unknown"),
        "findings": report.get("findings", "No findings recorded"),
        "recommendations": report.get("recommendations", ""),
        "analysisTime": report.get("analysisTime", "N/A"),
        "imageSize": report.get("imageSize", "N/A"),
        "imagePath": report.get("imagePath", ""),
        "filename": report.get("filename", ""),
        "status": report.get("status", "Completed"),
    }), 200


# ─── Upload + Analyze ────────────────────────────────────────────────────────

@api.post("/upload")
@login_required
def upload_scan():
    """
    Upload a dental image for analysis.
    Creates a scan record linked to the authenticated user.
    
    NOTE: AI model integration is a future step — this currently
    creates a placeholder analysis record.
    """
    email = g.current_user["email"]

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    # Validate file type
    allowed = {"png", "jpg", "jpeg", "bmp", "dicom", "dcm", "tiff", "tif"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        return jsonify({
            "error": f"File type '.{ext}' not supported. Use: {', '.join(sorted(allowed))}",
        }), 400

    # Read file to check size
    file_bytes = file.read()
    file_size = len(file_bytes)
    file.seek(0)

    if file_size > 10 * 1024 * 1024:  # 10 MB limit
        return jsonify({"error": "File too large. Maximum size is 10 MB."}), 400

    # ── Placeholder analysis (replace with real AI model later) ──
    confidence = random.randint(75, 98)
    severities = ["Low", "Moderate", "High"]
    severity = random.choices(severities, weights=[50, 35, 15])[0]

    findings_map = {
        "Low": "Minor enamel demineralization detected. No immediate treatment required.",
        "Moderate": "Potential caries detected. Early intervention recommended.",
        "High": "Significant caries formation observed. Immediate dental consultation advised.",
    }
    recommendations_map = {
        "Low": "Maintain good oral hygiene. Follow-up in 6 months.",
        "Moderate": "Schedule a dental appointment within 2-4 weeks for further evaluation.",
        "High": "Urgent dental visit required. Treatment should begin as soon as possible.",
    }

    scan_doc = {
        "user_email": email,
        "filename": file.filename,
        "fileSize": f"{file_size / 1024:.1f} KB",
        "date": datetime.utcnow(),
        "confidence": confidence,
        "severity": severity,
        "findings": findings_map[severity],
        "recommendations": recommendations_map[severity],
        "analysisTime": f"{random.uniform(1.5, 4.5):.1f} seconds",
        "imageSize": (
            f"{file_size / (1024 * 1024):.2f} MB"
            if file_size > 1024 * 1024
            else f"{file_size / 1024:.1f} KB"
        ),
        "status": "Completed",
    }

    result = scans.insert_one(scan_doc)
    log.info(f"New scan uploaded by {email}: {result.inserted_id}")

    return jsonify({
        "message": "Image uploaded and analyzed successfully",
        "reportId": str(result.inserted_id),
        "severity": severity,
        "confidence": confidence,
    }), 201


# ───predict route------------------
api = Blueprint('api', __name__)

@api.route('/predict', methods=['POST'])
def predict():
    file = request.files['image']

    # Convert image to numpy
    img = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    # Run model
    results = model(img)

    detections = []

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()

        for box, score in zip(boxes, scores):
            x1, y1, x2, y2 = box

            detections.append({
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "confidence": float(score)
            })

    return jsonify({"detections": detections})
