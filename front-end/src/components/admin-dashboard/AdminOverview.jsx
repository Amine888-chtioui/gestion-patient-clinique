// src/components/admin-dashboard/AdminOverview.jsx
import React from "react";

const AdminOverview = ({ stats, handleTabChange, actionLoading }) => {
  // Extraire les statistiques ou utiliser des valeurs par défaut
  const {
    total_patients = 0,
    total_doctors = 0,
    total_appointments = 0,
    appointments_today = 0,
    pending_appointments = 0,
    confirmed_appointments = 0,
    canceled_appointments = 0,
    new_patients_last_30_days = 0,
    medical_records_count = 0,
    prescriptions_count = 0,
    appointments_by_month = {},
    appointments_by_status = {}
  } = stats || {};

  return (
    <div className="overview-container">
      <div className="welcome-message">
        <h2>Bienvenue sur le tableau de bord administrateur</h2>
        <p>Gérez la clinique, les patients, les médecins et les rendez-vous</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-info">
            <h3>Patients</h3>
            <p className="stat-value">{total_patients}</p>
            <p className="stat-text">+{new_patients_last_30_days} ces 30 derniers jours</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>Médecins</h3>
            <p className="stat-value">{total_doctors}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>Rendez-vous</h3>
            <p className="stat-value">{total_appointments}</p>
            <p className="stat-text">{appointments_today} aujourd'hui</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>RDV en attente</h3>
            <p className="stat-value">{pending_appointments}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-medical"></i>
          </div>
          <div className="stat-info">
            <h3>Dossiers médicaux</h3>
            <p className="stat-value">{medical_records_count}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-prescription"></i>
          </div>
          <div className="stat-info">
            <h3>Ordonnances</h3>
            <p className="stat-value">{prescriptions_count}</p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Rendez-vous par mois</h3>
        <div className="chart-wrapper">
          {/* Ici, vous pourriez intégrer un graphique avec vos statistiques */}
          <div style={{ padding: "20px", textAlign: "center" }}>
            <i className="fas fa-chart-line" style={{ fontSize: "3rem", color: "#6a1b9a", marginBottom: "1rem" }}></i>
            <p>Graphique à implémenter avec une bibliothèque comme Chart.js ou Recharts</p>
            <p>Données disponibles dans stats.appointments_by_month</p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Répartition des rendez-vous par statut</h3>
        <div className="chart-wrapper">
          {/* Ici, vous pourriez intégrer un graphique en camembert */}
          <div style={{ padding: "20px", textAlign: "center" }}>
            <i className="fas fa-chart-pie" style={{ fontSize: "3rem", color: "#6a1b9a", marginBottom: "1rem" }}></i>
            <p>Graphique à implémenter avec une bibliothèque comme Chart.js ou Recharts</p>
            <p>Données disponibles dans stats.appointments_by_status</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Actions rapides</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => handleTabChange("patients")} disabled={actionLoading}>
            <i className="fas fa-user-plus"></i>
            Ajouter un patient
          </button>
          <button className="action-btn" onClick={() => handleTabChange("doctors")} disabled={actionLoading}>
            <i className="fas fa-user-md"></i>
            Ajouter un médecin
          </button>
          <button className="action-btn" onClick={() => handleTabChange("appointments")} disabled={actionLoading}>
            <i className="fas fa-calendar-plus"></i>
            Créer un rendez-vous
          </button>
          <button className="action-btn" onClick={() => handleTabChange("users")} disabled={actionLoading}>
            <i className="fas fa-user-cog"></i>
            Gérer les utilisateurs
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;