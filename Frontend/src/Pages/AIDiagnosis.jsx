// const ReportDetailsPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { addToast } = useToast();

//   const report = {
//     id: id,
//     date: "2024-11-01",
//     confidence: 94,
//     severity: "Low",
//     findings: "Minor enamel demineralization detected in lower left premolar",
//     recommendations:
//       "Maintain good oral hygiene. Follow-up in 6 months recommended.",
//     analysisTime: "3.2 seconds",
//     imageSize: "2.4 MB",
//   };

//   const handleDownload = () => {
//     addToast("Report downloaded successfully", "success");
//   };

//   return (
//     <div className="report-details-page">
//       <Header />
//       <div className="report-details-container">
//         <button className="back-button" onClick={() => navigate("/history")}>
//           ← Back to Reports
//         </button>

//         <div className="report-header">
//           <h1>Scan Report #{report.id}</h1>
//           <span className="report-date">{report.date}</span>
//         </div>

//         <div className="report-content">
//           <div className="report-main">
//             <Card className="report-image-section">
//               <h2>Analyzed Image</h2>
//               <div className="report-image-preview">
//                 <div className="image-placeholder">🦷</div>
//                 <div className="highlight-overlay">
//                   <span className="highlight-marker">⚠️</span>
//                 </div>
//               </div>
//             </Card>

//             <Card className="report-findings">
//               <h2>Clinical Findings</h2>
//               <div className="finding-item">
//                 <strong>Primary Finding:</strong>
//                 <p>{report.findings}</p>
//               </div>
//               <div className="finding-item">
//                 <strong>Recommendations:</strong>
//                 <p>{report.recommendations}</p>
//               </div>
//             </Card>
//           </div>

//           <div className="report-sidebar">
//             <Card className="metrics-card">
//               <h3>Analysis Metrics</h3>
//               <div className="metric-item">
//                 <span className="metric-label">Severity Level</span>
//                 <span
//                   className={`severity-badge severity-${report.severity.toLowerCase()}`}
//                 >
//                   {report.severity}
//                 </span>
//               </div>
//               <div className="metric-item">
//                 <span className="metric-label">Confidence Score</span>
//                 <span className="metric-value">{report.confidence}%</span>
//               </div>
//               <div className="metric-item">
//                 <span className="metric-label">Analysis Time</span>
//                 <span className="metric-value">{report.analysisTime}</span>
//               </div>
//               <div className="metric-item">
//                 <span className="metric-label">Image Size</span>
//                 <span className="metric-value">{report.imageSize}</span>
//               </div>
//             </Card>

//             <div className="report-actions">
//               <Button onClick={handleDownload}>
//                 <FileText size={18} /> Download PDF
//               </Button>
//               <Button variant="outline" onClick={() => navigate("/dashboard")}>
//                 Dashboard
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
