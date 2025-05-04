// src/components/doctor-dashboard/ContentHeader.jsx
import React, { useState, useRef, useEffect } from "react";
import NotificationButton from "./NotificationButton";

const ContentHeader = ({ 
  activeTab, 
  activeSubTab, 
  selectedPatient, 
  handleTabChange,
  handleLogout 
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Fermer le menu lorsqu'on clique en dehors
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

  let title = "";
  
  if (activeTab === "overview") {
    title = "Tableau de bord";
  } else if (activeTab === "appointments") {
    if (activeSubTab === "record") {
      title = `Créer un dossier médical - ${selectedPatient?.name || ""}`;
    } else {
      title = "Gestion des rendez-vous";
    }
  } else if (activeTab === "patients") {
    if (activeSubTab === "details") {
      title = `Dossier patient - ${selectedPatient?.name || ""}`;
    } else if (activeSubTab === "record") {
      title = `Créer un dossier médical - ${selectedPatient?.name || ""}`;
    } else if (activeSubTab === "prescription") {
      title = `Créer une ordonnance - ${selectedPatient?.name || ""}`;
    } else {
      title = "Mes patients";
    }
  } else if (activeTab === "profile") {
    title = "Mon profil";
  }

  return (
    <header className="content-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <div className="header-controls">
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