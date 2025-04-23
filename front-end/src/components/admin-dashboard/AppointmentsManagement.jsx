// src/components/admin-dashboard/AppointmentsManagement.jsx
import React, { useState } from "react";
import AppointmentForm from "./forms/AppointmentForm";

const AppointmentsManagement = ({
  appointments,
  patients,
  doctors,
  handleAddAppointment,
  handleUpdateAppointment,
  handleDeleteAppointment,
  actionLoading
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Filtrer les rendez-vous selon les critères
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.date === filterDate;
    const matchesSearch = !searchTerm || 
      (appointment.patient_name && appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appointment.doctor_name && appointment.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appointment.reason && appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  // Gérer la soumission du formulaire d'ajout
  const handleAddSubmit = (appointmentData) => {
    handleAddAppointment(appointmentData);
    setIsAdding(false);
  };

  // Gérer la soumission du formulaire de modification
  const handleEditSubmit = (appointmentData) => {
    handleUpdateAppointment(editingAppointment.id, appointmentData);
    setEditingAppointment(null);
  };

  // Annuler l'ajout ou la modification
  const handleCancel = () => {
    setIsAdding(false);
    setEditingAppointment(null);
  };

  // Si on est en mode ajout ou modification, afficher le formulaire
  if (isAdding || editingAppointment) {
    return (
      <AppointmentForm
        appointment={editingAppointment}
        patients={patients}
        doctors={doctors}
        onSubmit={isAdding ? handleAddSubmit : handleEditSubmit}
        onCancel={handleCancel}
        isLoading={actionLoading}
      />
    );
  }

  // Si on affiche les détails d'un rendez-vous
  if (viewingAppointment) {
    const patient = patients.find(p => p.id === viewingAppointment.patient_id) || {};
    const doctor = doctors.find(d => d.id === viewingAppointment.doctor_id) || {};

    return (
      <div className="appointment-details-view">
        <div className="panel-header">
          <h2>Détails du rendez-vous</h2>
          <button 
            className="btn-outline"
            onClick={() => setViewingAppointment(null)}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
        </div>

        <div className="appointment-card">
          <div className="appointment-header">
            <h3>Rendez-vous du {viewingAppointment.date} à {viewingAppointment.time}</h3>
            <div className="appointment-status">
              <span className={`status-badge ${viewingAppointment.status.replace(" ", "")}`}>
                {viewingAppointment.status}
              </span>
            </div>
          </div>

          <div className="appointment-details">
            <div className="appointment-participants">
              <div className="participant-card">
                <h4><i className="fas fa-user-injured"></i> Patient</h4>
                <div className="participant-info">
                  <p className="participant-name">{patient.name || viewingAppointment.patient_name || "Inconnu"}</p>
                  <p className="participant-contact">
                    <i className="fas fa-envelope"></i> {patient.email || "Non renseigné"}
                  </p>
                  <p className="participant-contact">
                    <i className="fas fa-phone"></i> {patient.phone || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="participant-card">
                <h4><i className="fas fa-user-md"></i> Médecin</h4>
                <div className="participant-info">
                  <p className="participant-name">Dr. {doctor.name || viewingAppointment.doctor_name || "Inconnu"}</p>
                  <p className="participant-detail">
                    <i className="fas fa-stethoscope"></i> {doctor.specialty || "Non spécifiée"}
                  </p>
                  <p className="participant-contact">
                    <i className="fas fa-envelope"></i> {doctor.email || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            <div className="appointment-section">
              <h4>Motif de la consultation</h4>
              <p className="appointment-reason">
                {viewingAppointment.reason || "Aucun motif spécifié"}
              </p>
            </div>

            {viewingAppointment.notes && (
              <div className="appointment-section">
                <h4>Notes</h4>
                <p className="appointment-notes">
                  {viewingAppointment.notes}
                </p>
              </div>
            )}
          </div>

          <div className="appointment-actions">
            <button
              className="btn-outline"
              onClick={() => setEditingAppointment(viewingAppointment)}
              disabled={actionLoading}
            >
              <i className="fas fa-edit"></i> Modifier
            </button>
            <button
              className="btn-outline danger"
              onClick={() => {
                if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous?")) {
                  handleDeleteAppointment(viewingAppointment.id);
                  setViewingAppointment(null);
                }
              }}
              disabled={actionLoading}
            >
              <i className="fas fa-trash-alt"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la liste des rendez-vous
  return (
    <div className="appointments-management">
      <div className="panel-header">
        <h2>Gestion des rendez-vous</h2>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(true)}
          disabled={actionLoading}
        >
          <i className="fas fa-calendar-plus"></i> Ajouter un rendez-vous
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmé">Confirmés</option>
            <option value="en attente">En attente</option>
            <option value="annulé">Annulés</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="date-filter"
          />
          <button
            className="btn-outline"
            onClick={() => {
              setFilterStatus("all");
              setFilterDate("");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="appointments-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Statut</th>
                <th>Motif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(appointment => (
                <tr key={appointment.id} className="appointment-row">
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.patient_name || "Inconnu"}</td>
                  <td>{appointment.doctor_name || "Inconnu"}</td>
                  <td>
                    <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    {appointment.reason
                      ? appointment.reason.length > 20
                        ? `${appointment.reason.substring(0, 20)}...`
                        : appointment.reason
                      : "Non spécifié"}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir détails"
                      onClick={() => setViewingAppointment(appointment)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-icon"
                      title="Modifier"
                      onClick={() => setEditingAppointment(appointment)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon"
                      title="Supprimer"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-calendar-times"></i>
          <h3>Aucun rendez-vous trouvé</h3>
          <p>Aucun rendez-vous ne correspond à vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;