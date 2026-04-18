import React, { useState, useEffect } from "react";
import { useNavigate } from "../App";
import { Bell, Upload, FileText } from "lucide-react";
import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Spinner from "../Components/Spinner.jsx";
import { downloadReportPdf } from "../utils/reportPdf";
import "./Pages.css";

const DashboardPage = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/dashboard-stats");
        if (!cancelled && res.ok) {
          setStats(await res.json());
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

  const recentReports = stats?.recentReports || [];

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Hello, {user?.name || "User"}! 👋</h1>
            <p>Welcome to your dental analysis dashboard</p>
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
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadReportPdf({
                                ...report,
                                resultSummary: report.findings,
                              });
                            }}
                          >
                            Download
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
    </div>
  );
};
export default DashboardPage;
