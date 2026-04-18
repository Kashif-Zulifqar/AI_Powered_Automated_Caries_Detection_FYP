// router.js

export const useNavigate = () => {
    return (path) => {
      window.location.hash = path;
    };
  };
  
  export const useParams = () => {
    const path = window.location.hash.slice(1) || "/";
    const parts = path.split("/");
    return { id: parts[parts.length - 1] };
  };