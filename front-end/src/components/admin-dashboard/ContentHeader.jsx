// src/components/admin-dashboard/ContentHeader.jsx
import React from "react";

const ContentHeader = ({ activeTab }) => {
  let title = "";
  
  switch (activeTab) {
    case "overview":
      title = "Tableau de bord";
      break;
    case "patients":
      title = "Gestion des patients";
      break;
    case "doctors":
      title = "Gestion des médecins";
      break;
    case "appointments":
      title = "Gestion des rendez-vous";
      break;
    case "medicalRecords":
      title = "Dossiers médicaux";
      break;
    case "statistics":
      title = "Statistiques";
      break;
    case "users":
      title = "Gestion des utilisateurs";
      break;
    default:
      title = "Administration";
  }
  
  return (
    <header className="content-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <button className="btn-secondary">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">3</span>
        </button>
        <button className="btn-secondary">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};

export default ContentHeader;