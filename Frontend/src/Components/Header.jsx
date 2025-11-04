import "./Components.css";
import { useAuth } from "../Contexts/AuthContext";
import { useNavigate } from "../App.jsx";
import { LogOut } from "lucide-react";
import Button from "./Button.jsx";
// import { Button } from "./UI/Button.jsx";
const Header = ({ isLanding = false }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate("/")}>
          🦷 DentalAI
        </div>
        <nav className="nav">
          {isLanding ? (
            <>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Testimonials</a>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/signup")}>Get Started</Button>
            </>
          ) : isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="nav-link"
              >
                Dashboard
              </button>
              <button onClick={() => navigate("/upload")} className="nav-link">
                Upload
              </button>
              <button onClick={() => navigate("/history")} className="nav-link">
                Reports
              </button>
              <button onClick={() => navigate("/profile")} className="nav-link">
                Profile
              </button>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={18} /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/signup")}>Sign Up</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
export default Header;
