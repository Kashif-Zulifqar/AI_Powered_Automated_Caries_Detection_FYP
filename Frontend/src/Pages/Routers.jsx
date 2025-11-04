const Routers = () => {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || "/"
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || "/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return {
    currentPath,
    navigate: (path) => {
      window.location.hash = path;
    },
  };
};

const useNavigate = () => {
  return (path) => {
    window.location.hash = path;
  };
};

const useParams = () => {
  const hash = window.location.hash.slice(1);
  const parts = hash.split("/");
  return { id: parts[parts.length - 1] };
};

const Routes = () => {
  const { currentPath } = Router();
  const { isAuthenticated } = useAuth();

  // Parse route
  let Component;
  if (currentPath === "/" || currentPath === "") {
    Component = LandingPage;
  } else if (currentPath === "/login") {
    Component = LoginPage;
  } else if (currentPath === "/signup") {
    Component = SignupPage;
  } else if (currentPath === "/dashboard") {
    Component = isAuthenticated ? DashboardPage : LoginPage;
  } else if (currentPath === "/upload") {
    Component = isAuthenticated ? UploadPage : LoginPage;
  } else if (currentPath === "/results") {
    Component = isAuthenticated ? ResultsPage : LoginPage;
  } else if (currentPath === "/history") {
    Component = isAuthenticated ? HistoryPage : LoginPage;
  } else if (currentPath.startsWith("/report/")) {
    Component = isAuthenticated ? ReportDetailsPage : LoginPage;
  } else if (currentPath === "/profile") {
    Component = isAuthenticated ? ProfilePage : LoginPage;
  } else {
    Component = LandingPage;
  }

  return <Component />;
};
