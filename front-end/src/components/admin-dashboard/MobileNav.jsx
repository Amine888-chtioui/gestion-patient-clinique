// src/components/admin-dashboard/MobileNav.jsx
import React, { useState } from "react";

const MobileNav = ({ activeTab, handleTabChange }) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  // Définir les principaux onglets à afficher directement dans la barre
  const mainTabs = [
    { id: "overview", icon: "home", label: "Accueil" },
    { id: "patients", icon: "user-injured", label: "Patients" },
    { id: "appointments", icon: "calendar-alt", label: "RDV" },
    { id: "doctors", icon: "user-md", label: "Médecins" },
    { id: "more", icon: "ellipsis-h", label: "Plus" } // Menu "Plus"
  ];
  
  // Onglets secondaires à afficher dans le menu "Plus"
  const moreTabs = [
    { id: "medicalRecords", icon: "file-medical", label: "Dossiers" },
    { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
    { id: "services", icon: "hospital", label: "Services" },
    { id: "payments", icon: "credit-card", label: "Paiements" },
    { id: "contacts", icon: "envelope", label: "Messages" },
    { id: "statistics", icon: "chart-bar", label: "Stats" },
    { id: "users", icon: "users", label: "Utilisateurs" },
    { id: "profile", icon: "user-cog", label: "Profil" }
  ];
  
  // Gérer le clic sur un onglet
  const handleTabClick = (tabId) => {
    if (tabId === "more") {
      setMoreMenuOpen(!moreMenuOpen);
    } else {
      handleTabChange(tabId);
      setMoreMenuOpen(false);
    }
  };
  
  return (
    <>
      <nav className="mobile-nav">
        {mainTabs.map((tab) => (
          <div
            key={tab.id}
            className={`mobile-nav-item ${activeTab === tab.id || (tab.id === "more" && moreMenuOpen) ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <i className={`fas fa-${tab.icon}`}></i>
            <span className="mobile-nav-label">{tab.label}</span>
          </div>
        ))}
      </nav>
      
      {/* Menu déroulant "Plus" */}
      {moreMenuOpen && (
        <div className="mobile-more-menu">
          {moreTabs.map((tab) => (
            <div
              key={tab.id}
              className={`mobile-more-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <i className={`fas fa-${tab.icon}`}></i>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Overlay pour fermer le menu quand on clique en dehors */}
      {moreMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMoreMenuOpen(false)}></div>
      )}
    </>
  );
};

export default MobileNav;