// src/components/common/ActionMessages.jsx
import React, { useEffect, useState } from "react";
import "./ActionMessages.css";

/**
 * Composant pour afficher les messages de succès et d'erreur des actions
 * @param {Object} props - Propriétés du composant
 * @param {string|null} props.success - Message de succès à afficher
 * @param {string|null} props.error - Message d'erreur à afficher
 * @param {number} props.autoHideDuration - Durée en ms avant que les messages se ferment automatiquement (0 pour désactiver)
 * @param {string} props.className - Classes CSS additionnelles
 * @returns {JSX.Element|null} Le composant d'affichage de messages d'action
 */
const ActionMessages = ({ 
  success, 
  error, 
  autoHideDuration = 5000,
  className = "" 
}) => {
  const [visible, setVisible] = useState({ success: false, error: false });

  // Gérer l'affichage et la disparition automatique des messages
  useEffect(() => {
    if (success) {
      setVisible(prev => ({ ...prev, success: true }));
      
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setVisible(prev => ({ ...prev, success: false }));
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    }
    
    return () => {}; // Cleanup function
  }, [success, autoHideDuration]);

  useEffect(() => {
    if (error) {
      setVisible(prev => ({ ...prev, error: true }));
      
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setVisible(prev => ({ ...prev, error: false }));
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    }
    
    return () => {}; // Cleanup function
  }, [error, autoHideDuration]);

  // Fermer manuellement un message
  const handleClose = (type) => {
    setVisible(prev => ({ ...prev, [type]: false }));
  };

  // Si aucun message n'est visible, ne rien afficher
  if (!success && !error) {
    return null;
  }

  return (
    <div className={`action-messages-container ${className}`}>
      {success && visible.success && (
        <div className="action-message success">
          <div className="message-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="message-content">
            <p>{success}</p>
          </div>
          <button 
            className="message-close" 
            onClick={() => handleClose('success')}
            aria-label="Fermer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {error && visible.error && (
        <div className="action-message error">
          <div className="message-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="message-content">
            <p>{error}</p>
          </div>
          <button 
            className="message-close" 
            onClick={() => handleClose('error')}
            aria-label="Fermer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMessages;