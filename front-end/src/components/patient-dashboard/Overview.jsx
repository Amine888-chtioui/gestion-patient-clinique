// src/components/patient-dashboard/Overview.jsx
import React from "react";

const Overview = ({ user, appointments, medicalRecords, prescriptions, handleTabChange, actionLoading }) => (
  <div className="overview-container">
    <div className="welcome-message">
      <h2>Bienvenue, {user?.name}!</h2>
      <p>Consultez vos rendez-vous, votre dossier médical et vos ordonnances</p>
    </div>

    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
        <div className="stat-info">
          <h3>Prochain RDV</h3>
          <p>{appointments.length > 0
            ? `${appointments[0].date} à ${appointments[0].time}`
            : "Aucun rendez-vous prévu"}
          </p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><i className="fas fa-notes-medical"></i></div>
        <div className="stat-info">
          <h3>Dernière consultation</h3>
          <p>{medicalRecords.length > 0
            ? medicalRecords[0].date
            : "Aucune consultation"}
          </p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><i className="fas fa-pills"></i></div>
        <div className="stat-info">
          <h3>Ordonnances actives</h3>
          <p>{prescriptions.length} ordonnance(s)</p>
        </div>
      </div>
    </div>

    <div className="quick-actions">
      <h3>Actions rapides</h3>
      <div className="action-buttons">
        <button className="action-btn" onClick={() => handleTabChange("book")} disabled={actionLoading}>
          <i className="fas fa-calendar-plus"></i>
          Prendre un rendez-vous
        </button>
        <button className="action-btn" onClick={() => handleTabChange("medicalRecords")} disabled={actionLoading}>
          <i className="fas fa-file-medical-alt"></i>
          Consulter mon dossier
        </button>
        <button className="action-btn" onClick={() => handleTabChange("prescriptions")} disabled={actionLoading}>
          <i className="fas fa-prescription-bottle-alt"></i>
          Voir mes ordonnances
        </button>
      </div>
    </div>

    <div className="recent-activity">
      <h3>Activité récente</h3>
      <div className="activity-list">
        {appointments.length > 0 || medicalRecords.length > 0 ? (
          <ul>
            {appointments.slice(0, 2).map(apt => (
              <li key={`apt-${apt.id}`} className="activity-item">
                <div className="activity-icon"><i className="fas fa-calendar"></i></div>
                <div className="activity-details">
                  <h4>Rendez-vous {apt.status}</h4>
                  <p>Le {apt.date} à {apt.time} avec {apt.doctor}</p>
                </div>
              </li>
            ))}
            {medicalRecords.slice(0, 2).map(record => (
              <li key={`record-${record.id}`} className="activity-item">
                <div className="activity-icon"><i className="fas fa-stethoscope"></i></div>
                <div className="activity-details">
                  <h4>{record.type}</h4>
                  <p>Le {record.date} avec {record.doctor}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <p>Aucune activité récente</p>}
      </div>
    </div>
  </div>
);

export default Overview;