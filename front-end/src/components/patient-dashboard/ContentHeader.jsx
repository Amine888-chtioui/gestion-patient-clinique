import React, { useState, useRef, useEffect } from "react";
import NotificationButton from "./NotificationButton";

const ContentHeader = ({ activeTab, handleTabChange, handleLogout, actionLoading }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique ailleurs
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

  return (
    <header className="content-header">
      <h1>
        {activeTab === "overview" && "Tableau de bord"}
        {activeTab === "appointments" && "Mes rendez-vous"}
        {activeTab === "book" && "Prendre un rendez-vous"}
        {activeTab === "medicalRecords" && "Mon dossier médical"}
        {activeTab === "prescriptions" && "Mes ordonnances"}
        {activeTab === "invoices" && "Mes factures"}
        {activeTab === "profile" && "Mon profil"}
      </h1>
      <div className="header-actions">
        <NotificationButton />
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
                className="profile-menu-item" 
                onClick={handleLogout}
                disabled={actionLoading}
              >
                <i className="fas fa-sign-out-alt"></i> 
                {actionLoading ? "Chargement..." : "Déconnexion"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ContentHeader;