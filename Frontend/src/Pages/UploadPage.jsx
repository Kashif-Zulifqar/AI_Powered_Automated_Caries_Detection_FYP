const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  const handleAnalyze = () => {
    if (!selectedFile) {
      addToast("Please select a file first", "error");
      return;
    }

    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            addToast("Analysis complete!", "success");
            navigate("/results");
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
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
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <Button variant="outline" as="span">
                    Select from Gallery
                  </Button>
                </label>
              </>
            )}
          </div>

          <div className="upload-options">
            <button className="option-button">
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
