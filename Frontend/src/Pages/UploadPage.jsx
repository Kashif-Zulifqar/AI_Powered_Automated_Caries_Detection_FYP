import React, { useState, useRef } from "react";
//import { useNavigate } from "../App.jsx";
import { Upload, Camera, FileText } from "lucide-react";
//import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import { useToast } from "../Contexts/ToastContext";
import "./report.css";
import axios from "axios";


const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [reportText, setReportText] = useState("");
  //const { authFetch } = useAuth();
  const { addToast } = useToast();
  //const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setPreview(URL.createObjectURL(files[0]));//preview ke liye URL.createObjectURL ka use kiya hai
      addToast("File selected successfully", "success");
    }
  };

  const drawBoxes = (detections) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
  
    const ctx = canvas.getContext("2d");
  
    // Actual image size
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
  
    // Displayed image size
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
  
    // Scale factors
    const scaleX = displayWidth / imgWidth;
    const scaleY = displayHeight / imgHeight;
  
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    detections.forEach((det) => {
      let [x1, y1, x2, y2] = det.bbox;
  
      // 🔥 SCALE FIX
      x1 *= scaleX;
      x2 *= scaleX;
      y1 *= scaleY;
      y2 *= scaleY;
  
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  
      ctx.fillStyle = "red";
      ctx.font = "14px Arial";
      ctx.fillText(
        (det.confidence * 100).toFixed(1) + "%",
        x1,
        y1 - 5
      );
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      addToast("File selected successfully", "success");
    }
  };

  

  const handleAnalyze = async () => {
    if (!selectedFile) {
      addToast("Please select a file first", "error");
      return;
    }
  
    setUploading(true);
    setProgress(0);
  
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 200);
  
    try {
      const formData = new FormData();
  
      // ⚠️ IMPORTANT: backend me key "image" hai
      formData.append("image", selectedFile);
  
      const res = await axios.post(
        "http://127.0.0.1:5000/api/predict",
        formData
      );
      setResult(res.data);
      setReportText(res.data.report);
      

      setTimeout(() => {
        drawBoxes(res.data.detections);
      }, 200);
  
      clearInterval(interval);
      setProgress(100);
  
      console.log("AI Result:", res.data);
  
      addToast("Analysis complete!", "success");
  
      setTimeout(() => {
        setUploading(false);
  
        // 👉 temporary: just log
        console.log(res.data);
  
        // 👉 next step me yahan navigate karenge
        // navigate("/report", { state: res.data });
  
      }, 500);
  
    } catch (err) {
      clearInterval(interval);
      setUploading(false);
      console.error(err);
      addToast("Detection failed", "error");
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:5000/api/generate-pdf",
        { report: reportText }
      );
  
      window.open("http://127.0.0.1:5000/api/generate-pdf");
  
    } catch (err) {
      console.error(err);
      addToast("PDF generation failed", "error");
    }
  };

  return (
    <div className="upload-page">
      <Header />
      <div className="upload-container">
        <h1>Upload Dental Image</h1>
        <p className="upload-subtitle">
          Upload X-rays or dental photos for AI-powered caries detection
        </p>

        <Card className="upload-card">
          <div
            className={`upload-dropzone ${isDragging ? "dragging" : ""} ${
              selectedFile ? "has-file" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="file-preview">
                <FileText size={48} />
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload size={48} />
                <h3>Drag & Drop Image Here</h3>
                <p>or</p>
                <label className="file-input-label">
                 <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Select from Gallery
                  </Button>
                </label>
              </>
            )}
          </div>

          <div className="upload-options">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="cameraInput"
              />

              <button
                className="option-button"
                onClick={() => document.getElementById("cameraInput").click()}
              >
                <Camera size={20} />
                <span>Capture from Webcam</span>
              </button>
          </div>

          {uploading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">Uploading... {progress}%</p>
            </div>
          )}

          <Button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Analyzing..." : "Analyze Now"}
          </Button>

          {preview && (
            <div style={{ position: "relative", marginTop: "20px" }}>
              
              <img
                ref={imageRef}
                src={preview}
                alt="preview"
                style={{ width: "100%", maxWidth: "500px" }}
                onLoad={() => {
                  if (result) drawBoxes(result.detections);
                }}
              />

              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              ></canvas>

            </div>
          )}

          {result && (
            <div className="result-section">
              <h3>Detection Results</h3>

              <Button onClick={handleDownloadPDF}>
                 Download PDF
              </Button>

              <p>Total Detections: {result.detections.length}</p>

              {result.detections.map((det, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <p>Box: {det.bbox.join(", ")}</p>
                  <p>Confidence: {(det.confidence * 100).toFixed(2)}%</p>
                </div>
              ))}
            </div>
        )}
        {reportText && (
            <div className="medical-report-box">
              <h2>📄 AI Medical Report</h2>
              <pre className="report-text">
                {reportText}
              </pre>
            </div>
          )}
        </Card>
        

        <div className="upload-tips">
          <h3>📋 Tips for Best Results</h3>
          <ul>
            <li>Use high-resolution images (minimum 1024x768)</li>
            <li>Ensure good lighting and clear focus</li>
            <li>Supported formats: JPG, PNG, DICOM</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default UploadPage;
