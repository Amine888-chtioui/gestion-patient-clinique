// src/components/admin-dashboard/ContentHeader.jsx - version améliorée
import React from "react";
import AdminNotificationButton from "./AdminNotificationButton";

const ContentHeader = ({ activeTab }) => {
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
      default:
        return "Administration";
    }
  };

  return (
    <header className="content-header">
      <h1>{getTabTitle()}</h1>
      <div className="header-actions">
        <AdminNotificationButton />
        <button className="btn-secondary">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};

export default ContentHeader;