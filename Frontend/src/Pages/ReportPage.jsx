import React from "react";

const ReportPage = ({ location }) => {
  const data = location.state;
  
  return (
    <div className="report-page">
      <h1>Dental AI Report</h1>

      <div className="report-card">
        <h3>Summary</h3>
        <p>{data.report}</p>

        <h3>Detections</h3>
        <p>Total: {data.detections.length}</p>

        <button onClick={() => window.print()}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ReportPage;