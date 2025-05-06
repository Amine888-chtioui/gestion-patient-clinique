// src/components/patient-dashboard/common/UnifiedLoadingSpinner.jsx
import React from "react";

/**
 * Unified loading spinner component for consistent loading states across the dashboard
 * 
 * @param {Object} props
 * @param {string} props.size - Size of the spinner: 'small', 'medium' (default), or 'large'
 * @param {string} props.text - Custom loading text (defaults to "Chargement...")
 * @param {boolean} props.fullScreen - Whether the spinner should take the full screen/container 
 * @param {string} props.color - Override the default primary color (optional)
 */
const UnifiedLoadingSpinner = ({
  size = "medium",
  text = "Chargement...",
  fullScreen = false,
  color
}) => {
  // Size mappings
  const sizeMap = {
    small: {
      spinner: "24px",
      border: "3px",
      fontSize: "0.8rem"
    },
    medium: {
      spinner: "40px",
      border: "4px",
      fontSize: "0.95rem"
    },
    large: {
      spinner: "60px",
      border: "5px",
      fontSize: "1.1rem"
    }
  };
  
  // Get size settings or default to medium
  const sizeSettings = sizeMap[size] || sizeMap.medium;
  
  // Custom styles
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    minHeight: fullScreen ? "calc(100vh - 150px)" : "200px",
    width: "100%"
  };
  
  const spinnerStyle = {
    width: sizeSettings.spinner,
    height: sizeSettings.spinner,
    border: `${sizeSettings.border} solid rgba(0, 0, 0, 0.1)`,
    borderRadius: "50%",
    borderTop: `${sizeSettings.border} solid ${color || "var(--primary-color)"}`,
    animation: "spin 1s linear infinite",
    marginBottom: "1rem"
  };
  
  const textStyle = {
    fontSize: sizeSettings.fontSize,
    color: "var(--text-light)",
    fontWeight: "500"
  };

  return (
    <div className="unified-loading-container" style={containerStyle}>
      <div className="unified-spinner" style={spinnerStyle}></div>
      {text && <p style={textStyle}>{text}</p>}
      
      {/* CSS animation for the spinner - will be injected into the page */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default UnifiedLoadingSpinner;