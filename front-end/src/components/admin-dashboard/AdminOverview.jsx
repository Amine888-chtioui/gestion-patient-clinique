// src/components/admin-dashboard/AdminOverview.jsx
import React from "react";

const AdminOverview = ({ stats, handleTabChange, actionLoading }) => {
  return (
    <div className="overview-container">
      <div className="welcome-message">
        <h2>Tableau de bord d'administration</h2>
        <p>Bienvenue dans le système de gestion de la clinique. Gérez les patients, médecins, rendez-vous et plus.</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-info">
            <h3>Patients</h3>
            <p className="stat-value">{stats.totalPatients || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>Médecins</h3>
            <p className="stat-value">{stats.totalDoctors || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>Rendez-vous aujourd'hui</h3>
            <p className="stat-value">{stats.appointmentsToday || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-medical"></i>
          </div>
          <div className="stat-info">
            <h3>Dossiers médicaux</h3>
            <p className="stat-value">{stats.totalRecords || 0}</p>
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
            Gérer les médecins
          </button>
          <button className="action-btn" onClick={() => handleTabChange("appointments")} disabled={actionLoading}>
            <i className="fas fa-calendar-plus"></i>
            Planifier un rendez-vous
          </button>
          <button className="action-btn" onClick={() => handleTabChange("users")} disabled={actionLoading}>
            <i className="fas fa-users-cog"></i>
            Gérer les utilisateurs
          </button>
        </div>
      </div>

      <div className="overview-panels">
        <div className="overview-panel">
          <h3><i className="fas fa-calendar-alt"></i> Rendez-vous récents</h3>
          {stats.recentAppointments && stats.recentAppointments.length > 0 ? (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>{appointment.date}</td>
                    <td>{appointment.patient_name}</td>
                    <td>{appointment.doctor_name}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">Aucun rendez-vous récent</p>
          )}
          <div className="panel-action">
            <button 
              className="btn-outline"
              onClick={() => handleTabChange("appointments")}
              disabled={actionLoading}
            >
              Voir tous les rendez-vous
            </button>
          </div>
        </div>

        <div className="overview-panel">
          <h3><i className="fas fa-chart-line"></i> Statistiques clés</h3>
          {stats.keyStats ? (
            <div className="key-stats">
              <div className="stat-item">
                <span className="stat-label">Taux d'occupation:</span>
                <span className="stat-num">{stats.keyStats.occupancyRate || 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rendez-vous hebdomadaires:</span>
                <span className="stat-num">{stats.keyStats.weeklyAppointments || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Nouveaux patients (mois):</span>
                <span className="stat-num">{stats.keyStats.newPatientsThisMonth || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Spécialité la plus demandée:</span>
                <span className="stat-num">{stats.keyStats.topSpecialty || "N/A"}</span>
              </div>
            </div>
          ) : (
            <p className="no-data">Aucune statistique disponible</p>
          )}
          <div className="panel-action">
            <button 
              className="btn-outline"
              onClick={() => handleTabChange("statistics")}
              disabled={actionLoading}
            >
              Voir toutes les statistiques
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;