// src/components/patient-dashboard/common/UnifiedLoadingSpinner.jsx
import React from "react";
import "./UnifiedSpinner.css";

/**
 * A unified loading spinner component for consistent loading states across the application
 * 
 * @param {Object} props
 * @param {string} props.text - Optional loading text to display under the spinner
 * @param {boolean} props.fullScreen - Whether the spinner should take the full screen height
 * @param {string} props.size - Size of the spinner: 'small', 'medium' (default), or 'large'
 * @param {string} props.color - Primary color (optional, defaults to theme primary color)
 */
const UnifiedLoadingSpinner = ({
  text = "Chargement...",
  fullScreen = false,
  size = "medium",
  color = null
}) => {
  // Define class names based on size and fullScreen props
  const containerClassName = `unified-loading-container ${fullScreen ? 'full-screen' : ''}`;
  const spinnerClassName = `unified-spinner ${size}`;
  const textClassName = `unified-loading-text ${size}`;
  
  // Optional inline styles for custom color
  const spinnerStyle = color ? {
    borderTopColor: color,
    borderLeftColor: color
  } : {};

  return (
    <div className={containerClassName}>
      <span className={spinnerClassName} style={spinnerStyle}></span>
      {text && <p className={textClassName}>{text}</p>}
    </div>
  );
};

export default UnifiedLoadingSpinner;