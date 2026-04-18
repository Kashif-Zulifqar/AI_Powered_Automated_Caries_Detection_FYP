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
from time import perf_counter
import logging
import importlib

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

    # Most recent 5
    recent = []
    for s in user_scans[:5]:
        d = s.get("date", now)
        recent.append({
            "id": str(s["_id"]),
            "reportName": s.get("reportName") or s.get("filename") or "Scan Report",
            "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
            "confidence": s.get("confidence", 0),
            "severity": s.get("severity", "Unknown"),
            "findings": s.get("findings", ""),
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
            "reportName": r.get("reportName") or r.get("filename") or "Scan Report",
            "filename": r.get("filename", ""),
            "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
            "confidence": r.get("confidence", 0),
            "severity": r.get("severity", "Unknown"),
            "status": r.get("status", "Completed"),
            "findings": r.get("findings", ""),
            "resultSummary": r.get("resultSummary", ""),
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
        "reportName": report.get("reportName") or report.get("filename") or "Scan Report",
        "date": d.strftime("%Y-%m-%d") if isinstance(d, datetime) else str(d),
        "confidence": report.get("confidence", 0),
        "severity": report.get("severity", "Unknown"),
        "findings": report.get("findings", "No findings recorded"),
        "recommendations": report.get("recommendations", ""),
        "analysisTime": report.get("analysisTime", "N/A"),
        "imageSize": report.get("imageSize", "N/A"),
        "imagePath": report.get("imagePath", ""),
        "filename": report.get("filename", ""),
        "resultSummary": report.get("resultSummary", ""),
        "detections": report.get("detections", []),
        "status": report.get("status", "Completed"),
    }), 200


# ─── Upload + Analyze ────────────────────────────────────────────────────────

@api.post("/upload")
@login_required
def upload_scan():
    """
    Upload a dental image, run model inference, and save a report
    linked to the authenticated user.
    """
    email = g.current_user["email"]

    file = request.files.get("image") or request.files.get("file")
    if file is None:
        return jsonify({"error": "No file uploaded"}), 400

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

    try:
        np = importlib.import_module("numpy")
        cv2 = importlib.import_module("cv2")
        from model_loader import model
    except Exception as exc:
        log.exception("Upload dependencies unavailable")
        return jsonify({
            "error": "AI dependencies are missing. Install numpy, opencv-python and ultralytics.",
            "details": str(exc),
        }), 500

    img = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Invalid or unreadable image file."}), 400

    start_time = perf_counter()
    results = model(img)
    elapsed = perf_counter() - start_time

    detections = []
    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        for box, score in zip(boxes, scores):
            x1, y1, x2, y2 = box
            detections.append({
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "confidence": float(score),
            })

    top_confidence = max((d["confidence"] for d in detections), default=0)
    confidence = round(top_confidence * 100)
    detection_count = len(detections)

    if detection_count == 0:
        severity = "Low"
        findings = "No strong caries regions detected by the model."
        recommendations = "Continue routine oral hygiene and periodic dental checkups."
    elif confidence >= 75:
        severity = "High"
        findings = f"{detection_count} high-confidence suspicious region(s) detected."
        recommendations = "Consult a dentist soon for a detailed examination and treatment plan."
    elif confidence >= 45:
        severity = "Moderate"
        findings = f"{detection_count} suspicious region(s) detected with moderate confidence."
        recommendations = "Book a dental evaluation to confirm findings and begin early care if needed."
    else:
        severity = "Low"
        findings = f"{detection_count} low-confidence suspicious region(s) detected."
        recommendations = "Monitor symptoms and follow up during your next routine dental visit."

    now = datetime.utcnow()
    report_name = file.filename or f"Scan {now.strftime('%Y-%m-%d %H:%M:%S')}"
    result_summary = f"{detection_count} detection(s), severity: {severity}"

    scan_doc = {
        "user_email": email,
        "filename": file.filename,
        "reportName": report_name,
        "fileSize": f"{file_size / 1024:.1f} KB",
        "date": now,
        "confidence": confidence,
        "severity": severity,
        "findings": findings,
        "recommendations": recommendations,
        "analysisTime": f"{elapsed:.2f} seconds",
        "imageSize": (
            f"{file_size / (1024 * 1024):.2f} MB"
            if file_size > 1024 * 1024
            else f"{file_size / 1024:.1f} KB"
        ),
        "resultSummary": result_summary,
        "detections": detections,
        "detectionCount": detection_count,
        "status": "Completed",
    }

    result = scans.insert_one(scan_doc)
    log.info(f"New scan uploaded by {email}: {result.inserted_id}")

    return jsonify({
        "message": "Image uploaded and analyzed successfully",
        "reportId": str(result.inserted_id),
        "reportName": report_name,
        "date": now.strftime("%Y-%m-%d"),
        "severity": severity,
        "confidence": confidence,
        "findings": findings,
        "recommendations": recommendations,
        "resultSummary": result_summary,
        "detections": detections,
    }), 201


# ─── Predict Route ───────────────────────────────────────────────────────────

@api.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded. Use form-data key 'image'."}), 400

    file = request.files['image']

    try:
        np = importlib.import_module("numpy")
        cv2 = importlib.import_module("cv2")
        from model_loader import model
    except Exception as exc:
        log.exception("Predict dependencies unavailable")
        return jsonify({
            "error": "AI dependencies are missing. Install numpy, opencv-python and ultralytics.",
            "details": str(exc),
        }), 500

    # Convert image to numpy
    img = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Invalid or unreadable image file."}), 400

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
