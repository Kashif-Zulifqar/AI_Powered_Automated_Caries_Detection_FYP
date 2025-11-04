const ResultsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const result = {
    severity: "Moderate",
    confidence: 87,
    findings: "Potential caries detected in upper right molar",
    recommendations: "Schedule dental appointment for further examination",
  };

  const handleDownload = () => {
    addToast("PDF Report downloaded successfully", "success");
  };

  return (
    <div className="results-page">
      <Header />
      <div className="results-container">
        <h1>Analysis Results</h1>

        <div className="results-grid">
          <Card className="results-image-card">
            <h2>Analyzed Image</h2>
            <div className="results-image-preview">
              <div className="image-placeholder">🦷</div>
              <div className="highlight-overlay">
                <span className="highlight-marker">⚠️</span>
              </div>
            </div>
            <p className="image-caption">
              Highlighted areas indicate potential caries
            </p>
          </Card>

          <div className="results-details">
            <Card className="detail-card">
              <h3>Severity Level</h3>
              <div
                className={`severity-display severity-${result.severity.toLowerCase()}`}
              >
                {result.severity}
              </div>
            </Card>

            <Card className="detail-card">
              <h3>Confidence Score</h3>
              <div className="confidence-display">
                <div className="confidence-circle">
                  <svg viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth="10"
                      strokeDasharray={`${result.confidence * 2.827} 282.7`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className="confidence-value">{result.confidence}%</span>
                </div>
              </div>
            </Card>

            <Card className="detail-card findings-card">
              <h3>Findings</h3>
              <p>{result.findings}</p>
              <h4>Recommendations</h4>
              <p>{result.recommendations}</p>
            </Card>
          </div>
        </div>

        <div className="results-actions">
          <Button onClick={handleDownload}>
            <FileText size={18} /> Download PDF Report
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
