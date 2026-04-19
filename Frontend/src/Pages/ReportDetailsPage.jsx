import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "../App.jsx";
import { FileText } from "lucide-react";
import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Spinner from "../Components/Spinner.jsx";
import { useToast } from "../Contexts/ToastContext";
import { downloadReportPdf } from "../utils/reportPdf";
import "./Pages.css";

const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/api/reports/${id}`);
        if (!cancelled) {
          if (res.ok) {
            setReport(await res.json());
          } else {
            const err = await res.json();
            addToast(err.error || "Report not found", "error");
            navigate("/history");
          }
        }
      } catch {
        if (!cancelled) {
          addToast("Failed to load report", "error");
          navigate("/history");
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, authFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    try {
      await downloadReportPdf(authFetch, report.id, report.reportId);
      addToast("Report downloaded successfully", "success");
    } catch (err) {
      addToast(err.message || "Failed to download PDF", "error");
    }
  };

  if (loading) {
    return (
      <div className="report-details-page">
        <Header />
        <div className="report-details-container">
          <div className="section-loader">
            <Spinner size={36} />
            <p>Loading report…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="report-details-page">
      <Header />
      <div className="report-details-container">
        <button className="back-button" onClick={() => navigate("/history")}>
          ← Back to Reports
        </button>

        <div className="report-header">
          <h1>{report.reportName || "Scan Report"}</h1>
          <span className="report-date">{report.date}</span>
        </div>

        <div className="report-content">
          <div className="report-main">
            <Card className="report-image-section">
              <h2>Analyzed Image</h2>
              <div className="report-image-preview">
                <div className="image-placeholder">🦷</div>
                <div className="highlight-overlay">
                  <span className="highlight-marker">⚠️</span>
                </div>
              </div>
            </Card>

            <Card className="report-findings">
              <h2>Clinical Findings</h2>
              <div className="finding-item">
                <strong>Primary Finding:</strong>
                <p>{report.findings}</p>
              </div>
              <div className="finding-item">
                <strong>Recommendations:</strong>
                <p>{report.recommendations}</p>
              </div>
            </Card>
          </div>

          <div className="report-sidebar">
            <Card className="metrics-card">
              <h3>Analysis Metrics</h3>
              <div className="metric-item">
                <span className="metric-label">Severity Level</span>
                <span
                  className={`severity-badge severity-${report.severity.toLowerCase()}`}
                >
                  {report.severity}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Confidence Score</span>
                <span className="metric-value">
                  {Math.round(
                    report.averageConfidence ?? report.confidence ?? 0,
                  )}
                  %
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Analysis Time</span>
                <span className="metric-value">{report.analysisDuration}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Image Size</span>
                <span className="metric-value">{report.imageSize}</span>
              </div>
            </Card>

            <div className="report-actions">
              <Button onClick={handleDownload}>
                <FileText size={18} /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportDetailsPage;
