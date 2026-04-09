import React, { useEffect, useId } from "react";
import "./Components.css";
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlay = true,
  closeOnEsc = true,
  hideCloseButton = false,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`modal-content modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className="modal-header">
          {title ? <h2 id={titleId}>{title}</h2> : <div />}
          {!hideCloseButton ? (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
export default Modal;
