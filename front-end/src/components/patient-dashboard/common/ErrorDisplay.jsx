// src/components/patient-dashboard/common/ErrorDisplay.jsx
import React from "react";
import { Link } from "react-router-dom";

const ErrorDisplay = ({ error }) => (
  <div className="patient-dashboard error-container">
    <div className="error-message">
      <i className="fas fa-exclamation-triangle"></i>
      <h2>Une erreur est survenue</h2>
      <p>{error}</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  </div>
);

export default ErrorDisplay;