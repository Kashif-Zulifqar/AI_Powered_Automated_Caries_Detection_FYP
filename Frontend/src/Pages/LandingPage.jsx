import React from "react";
import { useNavigate } from "../App.jsx";
import Header from "../Components/Header.jsx";
import Footer from "../Components/Footer.jsx";
import Card from "../Components/Card.jsx";
import Button from "../Components/Button.jsx";
import "./Pages.css";
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Header isLanding={true} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>AI-Powered Dental Caries Detection</h1>
          <p className="hero-subtitle">
            Detect dental cavities with precision using advanced artificial
            intelligence. Fast, accurate, and reliable results for better oral
            health.
          </p>
          <div className="hero-buttons">
            <Button onClick={() => navigate("/signup")}>
              Get Started Free
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">🦷</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose DentalAI?</h2>
        <div className="features-grid">
          <Card className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Detection</h3>
            <p>
              Advanced machine learning algorithms analyze dental images with
              high accuracy
            </p>
          </Card>
          <Card className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Reports</h3>
            <p>
              Your medical data is encrypted and stored securely with full HIPAA
              compliance
            </p>
          </Card>
          <Card className="feature-card">
            <div className="feature-icon">📤</div>
            <h3>Easy Upload</h3>
            <p>
              Simple drag-and-drop interface or capture images directly from
              your device
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
            <p>Upload dental X-rays or photos from your device</p>
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

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonials-grid">
          <Card className="testimonial-card">
            <p>
              "DentalAI has revolutionized our dental practice. The accuracy is
              remarkable!"
            </p>
            <div className="testimonial-author">
              <strong>Dr. Michael Chen</strong>
              <span>Dental Surgeon</span>
            </div>
          </Card>
          <Card className="testimonial-card">
            <p>
              "Fast, reliable, and easy to use. This tool saves us hours every
              week."
            </p>
            <div className="testimonial-author">
              <strong>Dr. Emily Roberts</strong>
              <span>Orthodontist</span>
            </div>
          </Card>
          <Card className="testimonial-card">
            <p>
              "The AI detection catches things we might have missed. Truly
              impressive technology."
            </p>
            <div className="testimonial-author">
              <strong>Dr. James Wilson</strong>
              <span>General Dentist</span>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default LandingPage;
