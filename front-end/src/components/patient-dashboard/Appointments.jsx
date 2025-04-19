// src/components/patient-dashboard/Appointments.jsx
import React from "react";

const Appointments = ({ appointments, handleCancelAppointment, handleTabChange, actionLoading }) => (
  <div className="appointments-container">
    <div className="filter-bar">
      <div className="search-box">
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Rechercher un rendez-vous..." />
      </div>
      <div className="filter-options">
        <select defaultValue="all">
          <option value="all">Tous les statuts</option>
          <option value="confirmé">Confirmés</option>
          <option value="en attente">En attente</option>
          <option value="annulé">Annulés</option>
        </select>
        <button className="btn-outline" disabled={actionLoading}>
          <i className="fas fa-filter"></i> Filtrer
        </button>
      </div>
    </div>

    <div className="appointments-list">
      {appointments.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Médecin</th>
              <th>Spécialité</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.id}>
                <td>{appointment.date}</td>
                <td>{appointment.time}</td>
                <td>{appointment.doctor}</td>
                <td>{appointment.specialty || "Non spécifié"}</td>
                <td>
                  {appointment.reason
                    ? appointment.reason.length > 30
                      ? `${appointment.reason.substring(0, 30)}...`
                      : appointment.reason
                    : "Non spécifié"}
                </td>
                <td>
                  <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                    {appointment.status}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn-icon" title="Voir les détails" disabled={actionLoading}>
                    <i className="fas fa-eye"></i>
                  </button>
                  {appointment.status !== "annulé" && new Date(appointment.date) > new Date() && (
                    <button className="btn-icon" title="Annuler" 
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={actionLoading}>
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <i className="fas fa-calendar-times"></i>
          <h3>Aucun rendez-vous</h3>
          <p>Vous n'avez pas encore de rendez-vous programmés</p>
          <button className="btn-primary" 
            onClick={() => handleTabChange("book")} 
            disabled={actionLoading}>
            Prendre un rendez-vous
          </button>
        </div>
      )}
    </div>
  </div>
);

export default Appointments;