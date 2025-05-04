// src/components/admin-dashboard/ContentHeader.jsx
import React, { useState, useRef, useEffect } from "react";
import AdminNotificationButton from "./AdminNotificationButton";

const ContentHeader = ({ activeTab, handleTabChange }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Tableau de bord";
      case "patients":
        return "Gestion des patients";
      case "doctors":
        return "Gestion des médecins";
      case "appointments":
        return "Gestion des rendez-vous";
      case "medicalRecords":
        return "Gestion des dossiers médicaux";
      case "invoices":
        return "Gestion des factures";
      case "payments":
        return "Gestion des paiements";
      case "statistics":
        return "Statistiques";
      case "users":
        return "Gestion des utilisateurs";
      case "profile":
        return "Mon profil";
      case "contacts":
        return "Messages de contact";
      case "services":
        return "Gestion des services";
      default:
        return "Administration";
    }
  };

  return (
    <header className="content-header">
      <h1>{getTabTitle()}</h1>
      <div className="header-actions">
        <div className="header-controls">
          <AdminNotificationButton />
          <div className="profile-menu-container" ref={menuRef}>
            <button 
              className="btn-secondary" 
              onClick={toggleProfileMenu}
              title="Options de profil"
            >
              <i className="fas fa-user"></i>
            </button>
            
            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <button 
                  className="profile-menu-item" 
                  onClick={() => {
                    handleTabChange("profile");
                    setShowProfileMenu(false);
                  }}
                >
                  <i className="fas fa-id-card"></i> Voir profil
                </button>
                <button 
                  className="profile-menu-item logout-menu-item" 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('admin-logout'));
                    setShowProfileMenu(false);
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ContentHeader;