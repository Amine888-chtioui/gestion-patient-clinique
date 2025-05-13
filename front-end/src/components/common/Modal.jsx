// src/components/patient-dashboard/common/Modal.jsx
import React, { useEffect, useRef } from "react";
// No CSS import here - we'll import it where we use the component

/**
 * Reusable Modal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Function to call when closing the modal
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size: 'small', 'medium' (default), 'large'
 */
const Modal = ({ isOpen, onClose, title, children, size = "medium" }) => {
  const modalRef = useRef(null);
  
  // Close when clicking outside the modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);
  
  // Close on escape key press
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Modal size classes
  const sizeClasses = {
    small: "modal-content-small",
    medium: "modal-content-medium",
    large: "modal-content-large"
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div 
        className={`modal-content ${sizeClasses[size] || "modal-content-medium"}`} 
        ref={modalRef}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;