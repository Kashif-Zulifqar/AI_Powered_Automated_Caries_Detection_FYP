import React, { useState, useEffect } from "react";
import { useNavigate } from "../App";
import { FileText } from "lucide-react";
import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import "./Pages.css";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Spinner from "../Components/Spinner.jsx";
import { downloadReportPdf } from "../utils/reportPdf";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDownload = (report, event) => {
    event.stopPropagation();
    downloadReportPdf(report);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/reports");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  return (
    <div className="history-page">
      <Header />
      <div className="history-container">
        <div className="history-header">
          <h1>My Reports</h1>
        </div>

        {loading ? (
          <div className="section-loader">
            <Spinner size={36} />
            <p>Loading reports…</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="history-grid">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="history-card"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <div className="history-card-header">
                  <div className="report-icon">📄</div>
                  <span className="report-date">{report.date}</span>
                </div>
                <div className="history-card-body">
                  <h3>{report.reportName || "Scan Report"}</h3>
                  <p className="history-summary">
                    {report.resultSummary ||
                      report.findings ||
                      "No summary available"}
                  </p>
                  <p className="history-id">Report ID: {report.id}</p>
                  <div className="report-stats">
                    <div className="stat">
                      <span className="stat-label">Severity</span>
                      <span
                        className={`severity-badge severity-${report.severity.toLowerCase()}`}
                      >
                        {report.severity}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Confidence</span>
                      <span className="confidence-badge">
                        {report.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="history-card-footer">
                  <span className="status-badge">{report.status}</span>
                  <div className="history-actions">
                    <Button
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/report/${report.id}`);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(event) => handleDownload(report, event)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={64} />
            <h2>No Reports Yet</h2>
            <p>No reports yet. Run your first scan to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default HistoryPage;
