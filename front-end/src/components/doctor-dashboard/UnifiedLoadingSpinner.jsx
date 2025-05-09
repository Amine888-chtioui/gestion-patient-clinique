// src/components/doctor-dashboard/UnifiedLoadingSpinner.jsx
import React from "react";

const UnifiedLoadingSpinner = ({ 
  text = "Loading...", 
  fullScreen = false,
  color = "primary" // You can customize this to use different colors
}) => {
  // Base styles
  const containerClass = fullScreen 
    ? "unified-spinner-fullscreen" 
    : "unified-spinner-container";
    
  // Color classes based on the color prop
  const spinnerColorClass = `spinner-${color}`;
  
  return (
    <div className={containerClass}>
      <div className="spinner-wrapper">
        <div className={`spinner ${spinnerColorClass}`}></div>
        {text && <p className="spinner-text">{text}</p>}
      </div>
    </div>
  );
};

export default UnifiedLoadingSpinner;