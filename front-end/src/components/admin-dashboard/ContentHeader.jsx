// src/components/admin-dashboard/ContentHeader.jsx
import React from "react";
import AdminNotificationButton from "./AdminNotificationButton";

const ContentHeader = ({ activeTab, handleTabChange }) => {
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
      default:
        return "Administration";
    }
  };

  return (
    <header className="content-header">
      <h1>{getTabTitle()}</h1>
      <div className="header-actions">
        <AdminNotificationButton />
        <button 
          className="btn-secondary" 
          onClick={() => handleTabChange("profile")}
          title="Mon profil"
        >
          <i className="fas fa-user"></i>
        </button>
      </div>
    </header>
  );
};

export default ContentHeader;