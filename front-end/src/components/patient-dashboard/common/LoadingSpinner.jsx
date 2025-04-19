// src/components/patient-dashboard/common/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = () => (
  <div className="patient-dashboard loading-container">
    <div className="spinner"></div>
    <p>Chargement en cours...</p>
  </div>
);

export default LoadingSpinner;
