import React from "react";
import "./Components.css";

const Spinner = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    className="spinner"
    aria-hidden="true"
  >
    <circle
      className="path"
      cx="25"
      cy="25"
      r="20"
      fill="none"
      strokeWidth="4"
    />
  </svg>
);

export default Spinner;
