import "./Components.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>🦷 DentalAI</h3>
          <p>AI-Powered Dental Caries Detection</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <a href="#faq">FAQ</a>
          <a href="#help">Help Center</a>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 DentalAI. All rights reserved.</p>
      </div>
    </footer>
  );
};
export default Footer;
