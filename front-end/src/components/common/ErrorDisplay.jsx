// src/components/common/ErrorDisplay.jsx
import React from "react";
import "./ErrorDisplay.css";

/**
 * Composant pour afficher les messages d'erreur globaux
 * @param {Object} props - Propriétés du composant
 * @param {string} props.error - Message d'erreur à afficher
 * @param {boolean} props.fullScreen - Si true, le message d'erreur prend toute la hauteur disponible
 * @param {string} props.className - Classes CSS additionnelles
 * @returns {JSX.Element} Le composant d'affichage d'erreur
 */
const ErrorDisplay = ({ error, fullScreen = false, className = "" }) => {
  return (
    <div className={`error-display-container ${fullScreen ? 'full-screen' : ''} ${className}`}>
      <div className="error-icon">
        <i className="fas fa-exclamation-circle"></i>
      </div>
      <h2 className="error-title">Erreur</h2>
      <p className="error-message">{error}</p>
      {fullScreen && (
        <div className="error-actions">
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/'}
          >
            Retour à l'accueil
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;