// src/components/doctor-dashboard/ContentHeader.jsx - version mise à jour
import React from "react";
import NotificationButton from "./NotificationButton";

const ContentHeader = ({ activeTab, activeSubTab, selectedPatient }) => {
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
        <NotificationButton />
        <button className="btn-secondary">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};

export default ContentHeader;