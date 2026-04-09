import React from "react";
import "./Components.css";
import Spinner from "./Spinner.jsx";

const Button = ({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  className = "",
  loading = false,
  loadingText = "",
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Spinner size={16} />
          {loadingText ? <span>{loadingText}</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
export { Button };
