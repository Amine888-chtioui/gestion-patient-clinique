import React, { useState, useRef, useEffect } from "react";
import AdminNotificationButton from "./AdminNotificationButton";

const ContentHeader = ({ activeTab, handleTabChange }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu quand on clique à l'extérieur
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
    const tabTitles = {
      overview: "Tableau de bord",
      patients: "Gestion des patients",
      doctors: "Gestion des médecins",
      appointments: "Gestion des rendez-vous",
      medicalRecords: "Gestion des dossiers médicaux",
      prescriptions: "Gestion des ordonnances",
      invoices: "Gestion des factures",
      payments: "Gestion des paiements",
      statistics: "Statistiques",
      users: "Gestion des utilisateurs",
      profile: "Mon profil",
      contacts: "Messages de contact",
      services: "Gestion des services"
    };
    
    return tabTitles[activeTab] || "Administration";
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