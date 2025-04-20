// src/components/doctor-dashboard/DoctorOverview.jsx
import React from "react";

const DoctorOverview = ({ 
  user, 
  appointments, 
  patients, 
  handleTabChange, 
  actionLoading 
}) => {
  // Calculer le nombre de rendez-vous aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const appointmentsToday = appointments.filter(apt => apt.date === today);
  
  // Calculer le nombre de rendez-vous en attente
  const pendingAppointments = appointments.filter(apt => apt.status === "en attente");

  return (
    <div className="overview-container">
      <div className="welcome-message">
        <h2>Bienvenue, Dr. {user?.name}!</h2>
        <p>Consultez vos rendez-vous et gérez vos patients</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-calendar-day"></i></div>
          <div className="stat-info">
            <h3>Rendez-vous aujourd'hui</h3>
            <p className="stat-value">{appointmentsToday.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
          <div className="stat-info">
            <h3>Rendez-vous en attente</h3>
            <p className="stat-value">{pendingAppointments.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <h3>Nombre de patients</h3>
            <p className="stat-value">{patients.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-clipboard-list"></i></div>
          <div className="stat-info">
            <h3>Total consultations</h3>
            <p className="stat-value">{appointments.filter(apt => apt.status === "confirmé").length}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Actions rapides</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => handleTabChange("appointments")} disabled={actionLoading}>
            <i className="fas fa-calendar-alt"></i>
            Voir les rendez-vous
          </button>
          <button className="action-btn" onClick={() => handleTabChange("patients")} disabled={actionLoading}>
            <i className="fas fa-user-injured"></i>
            Gérer les patients
          </button>
          <button className="action-btn" onClick={() => alert("Fonctionnalité en cours de développement")} disabled={actionLoading}>
            <i className="fas fa-prescription"></i>
            Créer une ordonnance
          </button>
          <button className="action-btn" onClick={() => alert("Fonctionnalité en cours de développement")} disabled={actionLoading}>
            <i className="fas fa-file-medical"></i>
            Rapports d'activité
          </button>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Rendez-vous à venir</h3>
          {appointments.length > 0 ? (
            <div className="upcoming-appointments">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments
                    .filter(apt => new Date(`${apt.date}T${apt.time}`) >= new Date())
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.time}`);
                      const dateB = new Date(`${b.date}T${b.time}`);
                      return dateA - dateB;
                    })
                    .slice(0, 5)
                    .map(appointment => (
                      <tr key={appointment.id}>
                        <td>{appointment.date}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.patient_name}</td>
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
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="text-right">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange("appointments")}
                  disabled={actionLoading}
                >
                  Voir tous les rendez-vous
                </button>
              </div>
            </div>
          ) : (
            <p className="no-data">Aucun rendez-vous à venir</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Patients récents</h3>
          {patients.length > 0 ? (
            <div className="recent-patients">
              <ul className="patient-list">
                {patients.slice(0, 5).map(patient => (
                  <li key={patient.id} className="patient-list-item">
                    <div className="patient-list-avatar">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className="patient-list-info">
                      <h4>{patient.name}</h4>
                      <p>Dernier RDV: {patient.last_appointment || "N/A"}</p>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => {
                        handleTabChange("patients");
                        // handlePatientSelect serait idéalement appelé ici
                      }}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="text-right">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange("patients")}
                  disabled={actionLoading}
                >
                  Voir tous les patients
                </button>
              </div>
            </div>
          ) : (
            <p className="no-data">Aucun patient récent</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;