// src/components/patient-dashboard/common/LoadingSpinner.jsx
import React from "react";
import "./UnifiedSpinner.css"; // Import the unified spinner styles

/**
 * Updated LoadingSpinner component with unified styling
 * This maintains compatibility with existing code while providing a consistent look
 */
const LoadingSpinner = ({ text = "Chargement en cours..." }) => {
  return (
    <div className="unified-loading-container full-screen">
      <span className="unified-spinner medium"></span>
      <p className="unified-loading-text medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;