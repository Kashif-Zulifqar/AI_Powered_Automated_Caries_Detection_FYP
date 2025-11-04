const Button = ({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
