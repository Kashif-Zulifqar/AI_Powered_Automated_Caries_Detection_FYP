const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      login(email, password);
      addToast("Login successful!", "success");
      navigate("/dashboard");
    } else {
      addToast("Please fill in all fields", "error");
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">
            Login to access your dental analysis dashboard
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
            <Button type="submit" className="auth-button">
              Login
            </Button>
          </form>
          <p className="auth-footer">
            Don't have an account?{" "}
            <a href="#" onClick={() => navigate("/signup")}>
              Sign Up
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};
