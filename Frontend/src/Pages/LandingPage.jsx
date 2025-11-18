import React from "react";
import { useNavigate } from "../App.jsx";
import Header from "../Components/Header.jsx";
import Footer from "../Components/Footer.jsx";
import Card from "../Components/Card.jsx";
import Button from "../Components/Button.jsx";
import "./Pages.css"; // Still needed for now, until we move to Tailwind

// 2. DATA SEPARATION: Define content data outside the component

const featureData = [
  { icon: "🤖", title: "AI Detection", description: "Advanced machine learning algorithms analyze dental images with high accuracy" },
  { icon: "🔒", title: "Secure Reports", description: "Your medical data is encrypted and stored securely with full HIPAA compliance" },
  { icon: "📤", title: "Easy Upload", title: "Easy Upload", description: "Simple drag-and-drop interface or capture images directly from your device" },
];

const testimonialData = [
  { quote: "DentalAI has revolutionized our dental practice. The accuracy is remarkable!", author: "Dr. Michael Chen", title: "Dental Surgeon" },
  { quote: "Fast, reliable, and easy to use. This tool saves us hours every week.", author: "Dr. Emily Roberts", title: "Orthodontist" },
  { quote: "The AI detection catches things we might have missed. Truly impressive technology.", author: "Dr. James Wilson", title: "General Dentist" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Header isLanding={true} />

      {/* 3. STRUCTURAL CLARITY: Added main-content wrapper */}
      <div className="main-content"> 
        
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>AI-Powered Automated Caries Detection</h1>
            <p className="hero-subtitle">
              Detect dental cavities with precision using advanced artificial intelligence. Fast, accurate, and reliable results for better oral health.
            </p>
            <div className="hero-buttons">
              <Button onClick={() => navigate("/signup")}>Get Started Free</Button>
              <Button variant="outline" onClick={() => navigate("/login")}>Login</Button>
            </div>
          </div>
          <div className="hero-image">
            {/* Image will be styled via CSS/Tailwind */}
          </div>
        </section>

        {/* Features Section - Using .map() */}
        <section id="features" className="features">
          <h2>Why Choose DentalAI?</h2>
          <div className="features-grid">
            {featureData.map((feature, index) => (
              <Card key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works">
          <h2>How It Works</h2>
          {/* Note: Steps are fine to be hardcoded as they are sequential/fixed */}
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

        {/* Testimonials Section - Using .map() */}
        <section id="testimonials" className="testimonials">
          <h2>What Our Users Say</h2>
          <div className="testimonials-grid">
            {testimonialData.map((testimonial, index) => (
              <Card key={index} className="testimonial-card">
                <p>"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.title}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div> {/* End main-content */}

      <Footer />
    </div>
  );
};

export default LandingPage;