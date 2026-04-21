import React from "react";
import { useNavigate } from "../App.jsx";
import Header from "../Components/Header.jsx";
import Footer from "../Components/Footer.jsx";
import Card from "../Components/Card.jsx";
import Button from "../Components/Button.jsx";
import "./Pages.css";
const LandingPage = () => {
  const navigate = useNavigate();
  const [navigating, setNavigating] = React.useState(false);

  return (
    <div className="landing-page">
      <Header isLanding={true} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>AI-Powered Automated Caries Detection</h1>
          <p className="hero-subtitle">
            Detect dental cavities with precision using advanced artificial
            intelligence. Fast, accurate, and reliable results for better oral
            health.
          </p>
          <div className="hero-buttons">
            <Button
              onClick={() => {
                setNavigating(true);
                setTimeout(() => navigate("/signup"), 180);
              }}
              className={navigating ? "page-fade exiting" : "page-fade"}
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNavigating(true);
                setTimeout(() => navigate("/login"), 180);
              }}
              className={navigating ? "page-fade exiting" : "page-fade"}
            >
              Login
            </Button>
          </div>
        </div>
        <div className="hero-image">
          {/* <div className="hero-placeholder">🦷</div> */}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose DentalAI?</h2>
        <div className="features-grid">
          <Card className="feature-card">
            <div className="feature-icon">🦷</div>
            <h3>Made for Common Users </h3>
            <p>
              Built for common public , so users can check cavity risk quickly
              and get to know about dental results easily .
            </p>
          </Card>
          <Card className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Detailed User Reports</h3>
            <p>
              Clear, easy-to-read reports help user understand dental findings
              and follow the measures with confidence.
            </p>
          </Card>
          <Card className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Results </h3>
            <p>
              Upload simple mobile images in seconds and get AI support quickly,
              which is ideal for dental awareness .
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload Image</h3>
            <p>Upload dental photos from your device</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Analysis</h3>
            <p>Our AI scans and detects potential caries</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Report</h3>
            <p>Download detailed PDF report with findings</p>
          </div>
        </div>
      </section>

      {/* Testimonials section hidden for now */}

      <Footer />
    </div>
  );
};
export default LandingPage;
