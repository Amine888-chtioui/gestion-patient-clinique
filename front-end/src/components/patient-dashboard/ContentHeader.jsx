// src/components/patient-dashboard/ContentHeader.jsx - version mise à jour
import React from "react";
import NotificationButton from "./NotificationButton";

const ContentHeader = ({ activeTab }) => (
  <header className="content-header">
    <h1>
      {activeTab === "overview" && "Tableau de bord"}
      {activeTab === "appointments" && "Mes rendez-vous"}
      {activeTab === "book" && "Prendre un rendez-vous"}
      {activeTab === "medicalRecords" && "Mon dossier médical"}
      {activeTab === "prescriptions" && "Mes ordonnances"}
      {activeTab === "profile" && "Mon profil"}
    </h1>
    <div className="header-actions">
      <NotificationButton />
      <button className="btn-secondary">
        <i className="fas fa-cog"></i>
      </button>
    </div>
  </header>
);

export default ContentHeader;
