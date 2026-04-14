import React, { useState, useRef } from "react";
//import { useNavigate } from "../App.jsx";
import { Upload, Camera, FileText } from "lucide-react";
//import { useAuth } from "../Contexts/AuthContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import { useToast } from "../Contexts/ToastContext";
import "./Pages.css";
import axios from "axios";

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
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
      addToast("File selected successfully", "success");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
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
        formData,
      );
      setResult(res.data);

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
          {result && (
            <div className="result-section">
              <h3>Detection Results</h3>

              <p>Total Detections: {result.detections.length}</p>

              {result.detections.map((det, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <p>Box: {det.bbox.join(", ")}</p>
                  <p>Confidence: {(det.confidence * 100).toFixed(2)}%</p>
                </div>
              ))}
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
