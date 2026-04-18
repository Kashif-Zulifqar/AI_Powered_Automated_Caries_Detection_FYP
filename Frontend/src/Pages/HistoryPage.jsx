import React, { useState, useEffect } from "react";
import { useNavigate } from "../App";
import { FileText, Trash2 } from "lucide-react";
import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import "./Pages.css";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Spinner from "../Components/Spinner.jsx";
import Modal from "../Components/Modal.jsx";
import { downloadReportPdf } from "../utils/reportPdf";
import { useToast } from "../Contexts/ToastContext";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDownload = (report, event) => {
    event.stopPropagation();
    downloadReportPdf(report);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    const reportId = pendingDeleteId;
    setDeletingId(reportId);
    try {
      const res = await authFetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete report");
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      addToast("Report deleted", "success");
    } catch (err) {
      addToast(err.message || "Failed to delete report", "error");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
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
                      className="report-action-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/report/${report.id}`);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="report-action-btn"
                      onClick={(event) => handleDownload(report, event)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="delete-action-btn report-action-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingDeleteId(report.id);
                      }}
                      disabled={deletingId === report.id}
                    >
                      <Trash2 size={16} />
                      {deletingId === report.id ? "Deleting..." : "Delete"}
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

      <Modal
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => {
          if (!deletingId) setPendingDeleteId(null);
        }}
        title="Confirm Delete"
        size="sm"
        closeOnOverlay={!deletingId}
        closeOnEsc={!deletingId}
        hideCloseButton={Boolean(deletingId)}
      >
        <div className="logout-confirmation">
          <p>Are you sure you want to delete this report?</p>
          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={Boolean(deletingId)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              loading={Boolean(deletingId)}
              loadingText="Deleting..."
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default HistoryPage;
