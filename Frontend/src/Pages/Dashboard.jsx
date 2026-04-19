import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "../App";
import { Bell, Upload, FileText, Trash2 } from "lucide-react";
import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Spinner from "../Components/Spinner.jsx";
import Modal from "../Components/Modal.jsx";
import { downloadReportPdf } from "../utils/reportPdf";
import { useToast } from "../Contexts/ToastContext";
import "./Pages.css";

const DashboardPage = () => {
  const { user, authFetch } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadStats = useCallback(
    async (cancelledRef) => {
      try {
        const res = await authFetch("/api/dashboard-stats");
        if ((!cancelledRef || !cancelledRef.current) && res.ok) {
          setStats(await res.json());
        }
      } catch {
        /* ignore */
      }
      if (!cancelledRef || !cancelledRef.current) setLoading(false);
    },
    [authFetch],
  );

  useEffect(() => {
    const cancelledRef = { current: false };
    loadStats(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [loadStats]);

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
      addToast("Report deleted", "success");
      await loadStats();
    } catch (err) {
      addToast(err.message || "Failed to delete report", "error");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const recentReports = stats?.recentReports || [];

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Hello, {user?.name || "User"}! 👋</h1>
            <p>Welcome to your dental analysis dashboard</p>
            {stats?.patientId && (
              <p className="patient-id-display">
                Patient ID: {stats.patientId}
              </p>
            )}
          </div>
          <div className="dashboard-actions">
            <button className="icon-button">
              <Bell size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="section-loader">
            <Spinner size={36} />
            <p>Loading dashboard…</p>
          </div>
        ) : (
          <>
            <div className="dashboard-stats">
              <Card className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>{stats?.totalScans ?? 0}</h3>
                  <p>Total Scans</p>
                </div>
              </Card>
              <Card className="stat-card confidence-stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{stats?.avgConfidence ?? 0}%</h3>
                  <p>Confidence Score</p>
                </div>
              </Card>
              <Card className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{stats?.thisMonth ?? 0}</h3>
                  <p>This Month</p>
                </div>
              </Card>
            </div>

            <div className="dashboard-main">
              <div className="quick-action-card">
                <h2>Quick Action</h2>
                <p>Upload a new dental image for AI analysis</p>
                <Button onClick={() => navigate("/upload")}>
                  <Upload size={18} /> Upload New Image
                </Button>
              </div>

              <div className="recent-reports-section">
                <div className="section-header">
                  <h2>Recent Reports</h2>
                  <a href="#" onClick={() => navigate("/history")}>
                    View All
                  </a>
                </div>
                {recentReports.length > 0 ? (
                  <div className="reports-list">
                    {recentReports.map((report) => (
                      <Card
                        key={report.id}
                        className="report-item"
                        onClick={() => navigate(`/report/${report.id}`)}
                      >
                        <div className="report-preview">📄</div>
                        <div className="report-info">
                          <h4>{report.reportName || "Scan Report"}</h4>
                          <p>{report.date}</p>
                        </div>
                        <div className="report-meta">
                          <span
                            className={`severity-badge severity-${report.severity.toLowerCase()}`}
                          >
                            {report.severity}
                          </span>
                          <Button
                            variant="outline"
                            className="report-action-btn"
                            onClick={async (event) => {
                              event.stopPropagation();
                              try {
                                await downloadReportPdf(
                                  authFetch,
                                  report.id,
                                  report.reportId,
                                );
                                addToast("PDF downloaded", "success");
                              } catch (err) {
                                addToast(
                                  err.message || "Failed to download PDF",
                                  "error",
                                );
                              }
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            className="delete-action-btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteId(report.id);
                            }}
                            disabled={deletingId === report.id}
                          >
                            <Trash2 size={16} />
                            {deletingId === report.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>
                      No reports yet. Run your first scan to see results here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
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
export default DashboardPage;
