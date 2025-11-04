import React from "react";
import { useNavigate } from "../App";
import { Upload, FileText } from "lucide-react";
import Header from "../Components/Header.jsx";
import "./Pages.css";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
const HistoryPage = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 1,
      date: "2024-11-01",
      confidence: 94,
      severity: "Low",
      status: "Completed",
    },
    {
      id: 2,
      date: "2024-10-28",
      confidence: 87,
      severity: "Moderate",
      status: "Completed",
    },
    {
      id: 3,
      date: "2024-10-25",
      confidence: 91,
      severity: "Low",
      status: "Completed",
    },
    {
      id: 4,
      date: "2024-10-20",
      confidence: 78,
      severity: "High",
      status: "Completed",
    },
    {
      id: 5,
      date: "2024-10-15",
      confidence: 92,
      severity: "Low",
      status: "Completed",
    },
  ];

  return (
    <div className="history-page">
      <Header />
      <div className="history-container">
        <div className="history-header">
          <h1>My Reports</h1>
          <Button onClick={() => navigate("/upload")}>
            <Upload size={18} /> New Analysis
          </Button>
        </div>

        {reports.length > 0 ? (
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
                  <h3>Scan #{report.id}</h3>
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
                  <span className="view-link">View Report →</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={64} />
            <h2>No Reports Yet</h2>
            <p>Upload your first dental image to get started</p>
            <Button onClick={() => navigate("/upload")}>Upload Image</Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default HistoryPage;
