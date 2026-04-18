import { jsPDF } from "jspdf";

const normalizePercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) return "N/A";
  return `${Math.round(Number(value))}%`;
};

const safeText = (value, fallback = "N/A") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

export const downloadReportPdf = (report = {}) => {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString();
  const title = safeText(
    report.reportName || report.filename,
    "Dental Scan Report",
  );
  const reportId = safeText(report.id, "N/A");
  const scanDate = safeText(report.date, new Date().toLocaleDateString());
  const severity = safeText(report.severity, "Unknown");
  const confidence = normalizePercent(report.confidence);
  const findings = safeText(report.findings, "No findings available");
  const recommendations = safeText(
    report.recommendations,
    "No recommendations available",
  );
  const summary = safeText(report.resultSummary, findings);

  doc.setFontSize(18);
  doc.text("Dental AI Scan Report", 14, 18);

  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, 14, 26);

  doc.setFontSize(12);
  doc.text(`Scan Name: ${title}`, 14, 36);
  doc.text(`Report ID: ${reportId}`, 14, 44);
  doc.text(`Scan Date: ${scanDate}`, 14, 52);
  doc.text(`Severity: ${severity}`, 14, 60);
  doc.text(`Confidence: ${confidence}`, 14, 68);

  const wrappedSummary = doc.splitTextToSize(`Summary: ${summary}`, 180);
  doc.text(wrappedSummary, 14, 80);

  const findingsTop = 80 + wrappedSummary.length * 6 + 4;
  doc.text("Findings:", 14, findingsTop);
  const wrappedFindings = doc.splitTextToSize(findings, 180);
  doc.text(wrappedFindings, 14, findingsTop + 8);

  const recommendationsTop = findingsTop + 8 + wrappedFindings.length * 6 + 6;
  doc.text("Recommendations:", 14, recommendationsTop);
  const wrappedRecommendations = doc.splitTextToSize(recommendations, 180);
  doc.text(wrappedRecommendations, 14, recommendationsTop + 8);

  const safeId = reportId.replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = safeId
    ? `dental-report-${safeId}.pdf`
    : `dental-report-${Date.now()}.pdf`;

  doc.save(fileName);
};
