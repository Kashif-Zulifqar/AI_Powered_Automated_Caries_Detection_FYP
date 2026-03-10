import React, { useEffect } from "react";
import { useNavigate } from "../App.jsx";
import Header from "../Components/Header.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

const ResultsPage = () => {
  const navigate = useNavigate();

  // If user arrives here without a specific report, redirect to history
  useEffect(() => {
    // Small delay for transition feel
    const t = setTimeout(() => navigate("/history"), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="results-page">
      <Header />
      <div className="results-container">
        <h1>Analysis Results</h1>
        <p>Redirecting to your reports…</p>
        <Button onClick={() => navigate("/history")}>View All Reports</Button>
      </div>
    </div>
  );
};
export default ResultsPage;
