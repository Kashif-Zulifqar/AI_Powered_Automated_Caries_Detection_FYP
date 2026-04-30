import io
import os
import random
import string
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

APP_NAME = "DentalAI"
APP_GENERATOR = "AI-Assisted Dental Analysis System"


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(total_pages)
            super().showPage()
        super().save()

    def _draw_footer(self, total_pages: int):
        page_number = self._pageNumber
        width, _ = A4
        y = 18
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4B5563"))
        self.drawString(36, y, APP_NAME)
        self.drawCentredString(width / 2, y, "Confidential - For Patient Use Only")
        self.drawRightString(width - 36, y, f"Page {page_number} of {total_pages}")


def generate_patient_id(existing: str | None = None, year: int | None = None) -> str:
    if existing:
        return existing
    year = year or datetime.utcnow().year
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"PT-{year}-{suffix}"


def generate_report_id() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"RPT-{suffix}"


def concern_level_from_confidence(confidence_percent: float, class_name: str = None) -> str:
    if class_name == "not_cavity":
        return "Low Concern / Monitor"
    if confidence_percent >= 75:
        return "High Concern"
    if confidence_percent >= 50:
        return "Moderate Concern"
    return "Low Concern / Monitor"


def confidence_band(avg_confidence: float) -> str:
    if avg_confidence >= 75:
        return "High"
    if avg_confidence >= 50:
        return "Moderate"
    return "Low"


def verdict_for_detections(total_detections: int, confidences: list[float], class_names: list[str] = None) -> tuple[str, str]:
    if class_names is None:
        class_names = []
    cavity_detections = sum(1 for cn in class_names if cn == "cavity")
    cavity_confidences = [c for c, cn in zip(confidences, class_names) if cn == "cavity"]
    max_conf = max(cavity_confidences, default=0)
    if cavity_detections == 0:
        return (
            "None",
            "No significant carious regions detected. Routine dental check-ups are recommended every 6 months.",
        )
    if cavity_detections >= 4 or max_conf >= 75:
        return (
            "Significant",
            "Multiple regions of concern detected. Prompt consultation with a licensed dentist is strongly recommended for clinical examination and appropriate treatment planning.",
        )
    return (
        "Mild",
        f"Early or mild signs of dental caries may be present in {cavity_detections} region(s). Professional evaluation is advised to confirm findings and discuss preventive care.",
    )


def draw_annotated_image(cv2_module: Any, image_bgr: Any, detections: list[dict]) -> bytes:
    annotated = image_bgr.copy()
    for index, detection in enumerate(detections, start=1):
        x1, y1, x2, y2 = detection["bbox"]
        score = detection["confidence"] * 100
        class_name = detection.get("class_name") or f"D{index}"
        color = (0, 0, 255) if class_name == "cavity" else (0, 255, 0) if class_name == "not_cavity" else (0, 0, 255)
        label = f"{class_name} {score:.1f}%"
        cv2_module.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2_module.putText(
            annotated,
            label,
            (x1, max(y1 - 8, 16)),
            cv2_module.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            2,
            cv2_module.LINE_AA,
        )
        cv2_module.putText(
            annotated,
            label,
            (x1, max(y1 - 8, 16)),
            cv2_module.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            1,
            cv2_module.LINE_AA,
        )

    ok, encoded = cv2_module.imencode(".png", annotated)
    if not ok:
        raise RuntimeError("Failed to encode annotated image")
    return encoded.tobytes()


def _term_statuses(detections: list[dict], avg_confidence: float, cavity_count: int = 0) -> dict[str, str]:
    """Determine status of dental findings based on cavity detections only."""
    cavity_high_confidence = any(d.get("class_name") == "cavity" and d["confidence"] * 100 >= 60 for d in detections)
    cavity_very_high_confidence = any(d.get("class_name") == "cavity" and d["confidence"] * 100 >= 75 for d in detections)
    multiple_cavities = cavity_count >= 2
    
    return {
        "Dental Caries (Tooth Decay)": "Detected / Possibly Affected" if cavity_count > 0 else "Not Indicated",
        "Enamel": "Detected / Possibly Affected" if cavity_high_confidence else "Not Indicated",
        "Dentin": "Detected / Possibly Affected" if cavity_count > 0 and avg_confidence >= 55 else "Not Indicated",
        "Dental Pulp": "Detected / Possibly Affected" if cavity_very_high_confidence else "Not Indicated",
        "Periapical Region": "Detected / Possibly Affected" if multiple_cavities and cavity_high_confidence else "Not Indicated",
        "Interproximal Caries": "Detected / Possibly Affected" if cavity_count > 0 else "Not Indicated",
        "Occlusal Surface": "Detected / Possibly Affected" if cavity_count > 0 else "Not Indicated",
        "Calculus / Tartar": "Detected / Possibly Affected" if cavity_high_confidence else "Not Indicated",
    }


def build_report_pdf(output_path: str, payload: dict):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCenter",
        parent=styles["Title"],
        alignment=1,
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
    )
    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=colors.HexColor("#0B3A66"),
        spaceBefore=10,
        spaceAfter=8,
    )
    normal_style = ParagraphStyle(
        "NormalReadable",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
    )
    small_italic = ParagraphStyle(
        "SmallItalic",
        parent=styles["Italic"],
        fontSize=8,
        textColor=colors.HexColor("#6B7280"),
        leading=11,
    )

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=34,
    )

    story = []
    story.append(Paragraph(APP_NAME, title_style))
    story.append(
        Paragraph(
            "Dental Caries Detection Report",
            ParagraphStyle(
                "ReportTitle",
                parent=styles["Heading1"],
                alignment=1,
                fontName="Helvetica-Bold",
                fontSize=18,
                textColor=colors.HexColor("#111827"),
            ),
        )
    )
    story.append(Spacer(1, 6))

    divider = Table([[""]], colWidths=[doc.width], rowHeights=[1])
    divider.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#CBD5E1"))]))
    story.append(divider)
    story.append(Spacer(1, 10))

    if payload.get("total_detections", 0) == 0:
        confidence_text = "N/A (No cavity detected)"
    else:
        confidence_text = payload.get(
            "confidence_summary",
            f"{payload.get('max_confidence', payload['avg_confidence']):.1f}% cavity confidence ({payload['confidence_level']})",
        )

    metadata_rows = [
        [
            Paragraph("<b>Patient Name</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["patient_name"], ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph("<b>Patient ID</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["patient_id"], ParagraphStyle(name="normal", fontSize=9, alignment=0)),
        ],
        [
            Paragraph("<b>Report ID</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["report_id"], ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph("<b>Date of Analysis</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["analysis_date"], ParagraphStyle(name="normal", fontSize=9, alignment=0)),
        ],
        [
            Paragraph("<b>Time of Analysis</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["analysis_time"], ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph("<b>Analyzed File</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(payload["filename"], ParagraphStyle(name="normal", fontSize=9, alignment=0, wordWrap="CJK")),
        ],
        [
            Paragraph("<b>Generated By</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(f"{APP_NAME} {APP_GENERATOR}", ParagraphStyle(name="normal", fontSize=9, alignment=0, wordWrap="CJK")),
            Paragraph("<b>Cavity Confidence</b>", ParagraphStyle(name="normal", fontSize=9, alignment=0)),
            Paragraph(confidence_text, ParagraphStyle(name="normal", fontSize=9, alignment=0)),
        ],
    ]

    metadata_table = Table(metadata_rows, colWidths=[85, 155, 85, 155])
    metadata_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1F2937")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(metadata_table)
    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "This report is AI-generated and is intended for informational purposes only. "
            "It does not constitute a medical diagnosis. Please consult a licensed dental "
            "professional for clinical evaluation.",
            small_italic,
        )
    )
    story.append(Spacer(1, 10))

    story.append(Paragraph("Radiographic Analysis - Annotated Image", section_style))

    image_reader = ImageReader(io.BytesIO(payload["annotated_image_bytes"]))
    img_w, img_h = image_reader.getSize()
    max_w = doc.width
    max_h = 3.5 * inch
    scale = min(max_w / img_w, max_h / img_h)
    image = Image(io.BytesIO(payload["annotated_image_bytes"]))
    image.drawWidth = img_w * scale
    image.drawHeight = img_h * scale
    image.hAlign = "CENTER"
    story.append(image)
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Figure 1: AI-detected regions of interest are highlighted. When no cavity is detected, the original image is shown without bounding boxes.",
            ParagraphStyle(
                "Caption",
                parent=normal_style,
                alignment=1,
                fontSize=9,
                textColor=colors.HexColor("#4B5563"),
            ),
        )
    )
    story.append(Spacer(1, 10))

    if payload.get("total_detections", 0) > 0:
        detection_rows = [["Class", "Region Coordinates", "Confidence Score", "Severity Level"]]
        for idx, detection in enumerate(payload["detections"], start=1):
            x1, y1, x2, y2 = detection["bbox"]
            score = detection["confidence"] * 100
            class_name = detection.get("class_name") or f"D{idx}"
            detection_rows.append(
                [
                    class_name,
                    f"({x1}, {y1}) - ({x2}, {y2})",
                    f"{score:.1f}%",
                    concern_level_from_confidence(score, class_name),
                ]
            )

        detection_table = Table(detection_rows, colWidths=[68, 180, 110, 170])
        detection_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B3A66")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(detection_table)
    else:
        story.append(
            Paragraph(
                "No cavity detections were found in this scan, so no bounding boxes, detection count, or confidence score are shown here.",
                normal_style,
            )
        )
        story.append(Spacer(1, 8))

    story.append(PageBreak())
    story.append(Paragraph("Image-Specific Findings", section_style))

    cavity_count = payload.get("cavity_count", 0)
    if cavity_count == 0:
        story.append(
            Paragraph(
                "This scan does not contain any cavity detections. No bounding boxes, detection counts, or confidence values are shown because the image was classified as not cavity.",
                normal_style,
            )
        )
    else:
        story.append(
            Paragraph(
                f"This scan contains {cavity_count} cavity detection(s). The findings below are generated from this specific image only and do not include non-cavity detections.",
                normal_style,
            )
        )
        story.append(Spacer(1, 8))

        findings_rows = [["Region", "Class", "Bounding Box", "Confidence", "Image-Specific Note"]]
        for index, detection in enumerate(payload["detections"], start=1):
            x1, y1, x2, y2 = detection["bbox"]
            confidence_percent = detection["confidence"] * 100
            location_text = f"({x1}, {y1}) - ({x2}, {y2})"
            findings_rows.append(
                [
                    f"Region {index}",
                    detection.get("class_name", "cavity"),
                    location_text,
                    f"{confidence_percent:.1f}%",
                    "Cavity-only detection used for report generation.",
                ]
            )

        findings_table = Table(findings_rows, colWidths=[60, 70, 160, 70, 173])
        findings_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#14532D")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(findings_table)

    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "Clinical interpretation is limited to what the model highlighted in this specific image. Non-cavity predictions are excluded from the report to keep the output image-specific and clinically clearer.",
            small_italic,
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("Final Verdict", section_style))
    story.append(
        Paragraph(
            f"<b>Verdict Level:</b> {payload['verdict_level']}",
            ParagraphStyle(
                "VerdictLevel",
                parent=normal_style,
                fontName="Helvetica-Bold",
                fontSize=12,
                textColor=colors.HexColor("#7C2D12"),
                spaceAfter=6,
            ),
        )
    )
    story.append(Paragraph(payload["verdict_text"], normal_style))
    story.append(Spacer(1, 14))
    story.append(Paragraph("General Dental Health Recommendations", section_style))

    recommendations = [
        "Brush twice daily with fluoride toothpaste.",
        "Floss daily to remove interproximal plaque.",
        "Limit sugary and acidic food and drink intake.",
        "Schedule professional cleanings every 6 months.",
        "Drink fluoridated water where available.",
        "Do not ignore tooth sensitivity - seek early evaluation.",
    ]
    for tip in recommendations:
        story.append(Paragraph(f"- {tip}", normal_style))
        story.append(Spacer(1, 3))

    doc.build(story, canvasmaker=NumberedCanvas)
