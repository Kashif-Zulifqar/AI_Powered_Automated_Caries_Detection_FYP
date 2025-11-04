const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const recentReports = [
    { id: 1, date: "2024-11-01", confidence: 94, severity: "Low" },
    { id: 2, date: "2024-10-28", confidence: 87, severity: "Moderate" },
    { id: 3, date: "2024-10-25", confidence: 91, severity: "Low" },
  ];

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
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>

        <div className="dashboard-stats">
          <Card className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>12</h3>
              <p>Total Scans</p>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>89%</h3>
              <p>Avg Confidence</p>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>3</h3>
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
                      <h4>Scan #{report.id}</h4>
                      <p>{report.date}</p>
                    </div>
                    <div className="report-meta">
                      <span
                        className={`severity-badge severity-${report.severity.toLowerCase()}`}
                      >
                        {report.severity}
                      </span>
                      <span className="confidence">{report.confidence}%</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={48} />
                <p>No reports yet</p>
                <Button variant="outline" onClick={() => navigate("/upload")}>
                  Upload First Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
