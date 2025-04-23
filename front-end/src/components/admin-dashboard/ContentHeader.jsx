// src/components/admin-dashboard/ContentHeader.jsx
import React from "react";

const ContentHeader = ({ activeTab }) => {
  // Définir le titre en fonction de l'onglet actif
  const getTitle = () => {
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
        return "Dossiers médicaux";
      case "statistics":
        return "Statistiques et analyses";
      case "users":
        return "Gestion des utilisateurs";
      default:
        return "Tableau de bord";
    }
  };

  return (
    <header className="content-header">
      <h1>{getTitle()}</h1>
      <div className="header-actions">
        <button className="btn-secondary">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">4</span>
        </button>
        <button className="btn-secondary">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};

export default ContentHeader;
