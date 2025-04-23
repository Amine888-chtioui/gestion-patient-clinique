// src/components/admin-dashboard/PatientsManagement.jsx
import React, { useState } from "react";
import PatientForm from "./forms/PatientForm";

const PatientsManagement = ({
  patients,
  doctors,
  handleAddPatient,
  handleUpdatePatient,
  handleDeletePatient,
  actionLoading,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPatient, setCurrentPatient] = useState(null);
  const [viewType, setViewType] = useState("grid"); // "grid" ou "list"

  // Filtrer les patients selon le terme de recherche
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gérer la soumission du formulaire d'ajout
  const handleAddSubmit = (patientData) => {
    handleAddPatient(patientData);
    setIsAdding(false);
  };

  // Gérer la soumission du formulaire de modification
  const handleEditSubmit = (patientData) => {
    handleUpdatePatient(editingPatient.id, patientData);
    setEditingPatient(null);
  };

  // Annuler l'ajout ou la modification
  const handleCancel = () => {
    setIsAdding(false);
    setEditingPatient(null);
  };

  // Afficher les détails d'un patient
  const handleViewDetails = (patient) => {
    setCurrentPatient(patient);
  };

  // Si on est en mode ajout ou modification, afficher le formulaire
  if (isAdding || editingPatient) {
    return (
      <PatientForm
        patient={editingPatient}
        doctors={doctors}
        onSubmit={isAdding ? handleAddSubmit : handleEditSubmit}
        onCancel={handleCancel}
        isLoading={actionLoading}
      />
    );
  }

  // Si on affiche les détails d'un patient
  if (currentPatient) {
    return (
      <div className="patient-details-view">
        <div className="panel-header">
          <h2>Détails du patient</h2>
          <button
            className="btn-outline"
            onClick={() => setCurrentPatient(null)}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-info">
              <h3>{currentPatient.name}</h3>
              <p className="profile-email">{currentPatient.email}</p>
              <div className="profile-basic-info">
                <span className="info-item">
                  <i className="fas fa-phone"></i>{" "}
                  {currentPatient.phone || "Non renseigné"}
                </span>
                <span className="info-item">
                  <i className="fas fa-birthday-cake"></i>{" "}
                  {currentPatient.date_of_birth || "Non renseigné"}
                </span>
              </div>
            </div>
            <div className="profile-actions">
              <button
                className="btn-outline"
                onClick={() => setEditingPatient(currentPatient)}
                disabled={actionLoading}
              >
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button
                className="btn-outline danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Êtes-vous sûr de vouloir supprimer ce patient?"
                    )
                  ) {
                    handleDeletePatient(currentPatient.id);
                    setCurrentPatient(null);
                  }
                }}
                disabled={actionLoading}
              >
                <i className="fas fa-trash-alt"></i> Supprimer
              </button>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-section">
              <h4>Informations personnelles</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Adresse:</span>
                  <span className="detail-value">
                    {currentPatient.address || "Non renseignée"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Groupe sanguin:</span>
                  <span className="detail-value">
                    {currentPatient.blood_type || "Non renseigné"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact d'urgence:</span>
                  <span className="detail-value">
                    {currentPatient.emergency_contact || "Non renseigné"}
                  </span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Allergies:</span>
                  <span className="detail-value">
                    {currentPatient.allergies &&
                    currentPatient.allergies.length > 0
                      ? currentPatient.allergies.join(", ")
                      : "Aucune allergie renseignée"}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Informations médicales</h4>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <span className="detail-label">Maladies chroniques:</span>
                  <span className="detail-value">
                    {currentPatient.chronic_diseases &&
                    currentPatient.chronic_diseases.length > 0
                      ? currentPatient.chronic_diseases.join(", ")
                      : "Aucune maladie chronique renseignée"}
                  </span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Antécédents médicaux:</span>
                  <div className="detail-value text-block">
                    {currentPatient.medical_history ||
                      "Aucun antécédent médical renseigné"}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Rendez-vous récents</h4>
              {currentPatient.recent_appointments &&
              currentPatient.recent_appointments.length > 0 ? (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Médecin</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPatient.recent_appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.date}</td>
                        <td>{appointment.doctor_name}</td>
                        <td>
                          <span
                            className={`status-badge ${appointment.status.replace(
                              " ",
                              ""
                            )}`}
                          >
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la liste des patients
  return (
    <div className="patients-management">
      <div className="panel-header">
        <h2>Gestion des patients</h2>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(true)}
          disabled={actionLoading}
        >
          <i className="fas fa-user-plus"></i> Ajouter un patient
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-options">
          <button
            className={`view-option ${viewType === "grid" ? "active" : ""}`}
            onClick={() => setViewType("grid")}
            disabled={actionLoading}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button
            className={`view-option ${viewType === "list" ? "active" : ""}`}
            onClick={() => setViewType("list")}
            disabled={actionLoading}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {filteredPatients.length > 0 ? (
        viewType === "grid" ? (
          <div className="patients-grid">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="patient-card">
                <div className="patient-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <h3 className="patient-name">{patient.name}</h3>
                <p className="patient-email">{patient.email}</p>
                <div className="patient-info">
                  <p>
                    <i className="fas fa-phone"></i>
                    {patient.phone || "Non renseigné"}
                  </p>
                  <p>
                    <i className="fas fa-calendar-alt"></i>
                    Dernier RDV: {patient.last_appointment || "Aucun"}
                  </p>
                </div>
                <div className="patient-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleViewDetails(patient)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-eye"></i> Détails
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setEditingPatient(patient)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-edit"></i> Modifier
                  </button>
                  <button
                    className="btn-outline danger"
                    onClick={() => handleDeletePatient(patient.id)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-trash-alt"></i> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="patients-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Date de naissance</th>
                  <th>Dernier RDV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="patient-row">
                    <td>
                      <div className="patient-name-cell">
                        <div className="patient-avatar-small">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <span>{patient.name}</span>
                      </div>
                    </td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || "Non renseigné"}</td>
                    <td>{patient.date_of_birth || "Non renseignée"}</td>
                    <td>{patient.last_appointment || "Aucun"}</td>
                    <td className="actions">
                      <button
                        className="btn-icon"
                        title="Voir détails"
                        onClick={() => handleViewDetails(patient)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon"
                        title="Modifier"
                        onClick={() => setEditingPatient(patient)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon"
                        title="Supprimer"
                        onClick={() => handleDeletePatient(patient.id)}
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
        )
      ) : (
        <div className="empty-state">
          <i className="fas fa-users"></i>
          <h3>Aucun patient trouvé</h3>
          <p>Aucun patient ne correspond à vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};
export default PatientsManagement;
