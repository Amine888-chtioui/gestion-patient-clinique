// src/components/patient-dashboard/Appointments.jsx
import React, { useState } from "react";
import AppointmentEditor from "./AppointmentEditor";

const Appointments = ({ 
  appointments, 
  doctors,
  handleCancelAppointment, 
  handleUpdateAppointment,
  handleTabChange, 
  actionLoading 
}) => {
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fonction pour filtrer les rendez-vous
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filter === "all" || appointment.status === filter;
    const matchesSearch = searchTerm === "" || 
      appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.reason && appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Lancer l'édition d'un rendez-vous
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  // Si on est en mode édition, afficher le formulaire d'édition
  if (editingAppointment) {
    return (
      <AppointmentEditor
        appointment={editingAppointment}
        doctors={doctors}
        handleUpdateAppointment={handleUpdateAppointment}
        handleCancel={handleCancelEdit}
        actionLoading={actionLoading}
      />
    );
  }

  return (
    <div className="appointments-container">
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un rendez-vous..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            defaultValue="all"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmé">Confirmés</option>
            <option value="en attente">En attente</option>
            <option value="annulé">Annulés</option>
          </select>
          <button className="btn-outline" onClick={() => {
            setFilter("all");
            setSearchTerm("");
          }} disabled={actionLoading}>
            <i className="fas fa-filter"></i> Réinitialiser
          </button>
        </div>
      </div>

      <div className="appointments-list">
        {filteredAppointments.length > 0 ? (
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
              {filteredAppointments.map(appointment => (
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
                    
                    {/* Bouton d'édition pour les rendez-vous non annulés et futurs */}
                    {appointment.status !== "annulé" && new Date(appointment.date) > new Date() && (
                      <button 
                        className="btn-icon" 
                        title="Modifier" 
                        onClick={() => handleEditAppointment(appointment)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    
                    {/* Bouton d'annulation pour les rendez-vous non annulés et futurs */}
                    {appointment.status !== "annulé" && new Date(appointment.date) > new Date() && (
                      <button 
                        className="btn-icon" 
                        title="Annuler" 
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={actionLoading}
                      >
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
            <button 
              className="btn-primary" 
              onClick={() => handleTabChange("book")} 
              disabled={actionLoading}
            >
              Prendre un rendez-vous
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;