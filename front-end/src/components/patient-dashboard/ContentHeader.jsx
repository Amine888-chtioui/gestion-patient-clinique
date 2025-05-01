// src/components/patient-dashboard/ContentHeader.jsx
import React from "react";
import NotificationButton from "./NotificationButton";

const ContentHeader = ({ activeTab, handleTabChange }) => (
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

export default ContentHeader;