// src/components/admin-dashboard/DoctorsManagement.jsx
import React, { useState } from "react";
import DoctorForm from "./forms/DoctorForm";

const DoctorsManagement = ({
  doctors,
  handleAddDoctor,
  handleUpdateDoctor,
  handleDeleteDoctor,
  actionLoading
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [viewType, setViewType] = useState("grid"); // "grid" ou "list"

  // Filtrer les médecins selon le terme de recherche
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Gérer la soumission du formulaire d'ajout
  const handleAddSubmit = (doctorData) => {
    handleAddDoctor(doctorData);
    setIsAdding(false);
  };

  // Gérer la soumission du formulaire de modification
  const handleEditSubmit = (doctorData) => {
    handleUpdateDoctor(editingDoctor.id, doctorData);
    setEditingDoctor(null);
  };

  // Annuler l'ajout ou la modification
  const handleCancel = () => {
    setIsAdding(false);
    setEditingDoctor(null);
  };

  // Afficher les détails d'un médecin
  const handleViewDetails = (doctor) => {
    setCurrentDoctor(doctor);
  };

  // Si on est en mode ajout ou modification, afficher le formulaire
  if (isAdding || editingDoctor) {
    return (
      <DoctorForm
        doctor={editingDoctor}
        onSubmit={isAdding ? handleAddSubmit : handleEditSubmit}
        onCancel={handleCancel}
        isLoading={actionLoading}
      />
    );
  }

  // Si on affiche les détails d'un médecin
  if (currentDoctor) {
    return (
      <div className="doctor-details-view">
        <div className="panel-header">
          <h2>Détails du médecin</h2>
          <button
            className="btn-outline"
            onClick={() => setCurrentDoctor(null)}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="profile-info">
              <h3>Dr. {currentDoctor.name}</h3>
              <p className="profile-email">{currentDoctor.email}</p>
              <p className="profile-specialty">
                {currentDoctor.specialty || "Médecin généraliste"}
              </p>
            </div>
            <div className="profile-actions">
              <button
                className="btn-outline"
                onClick={() => setEditingDoctor(currentDoctor)}
                disabled={actionLoading}
              >
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button
                className="btn-outline danger"
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce médecin?")) {
                    handleDeleteDoctor(currentDoctor.id);
                    setCurrentDoctor(null);
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
                  <span className="detail-label">Téléphone:</span>
                  <span className="detail-value">{currentDoctor.phone || "Non renseigné"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{currentDoctor.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Adresse:</span>
                  <span className="detail-value">{currentDoctor.address || "Non renseignée"}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Informations professionnelles</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Spécialité:</span>
                  <span className="detail-value">{currentDoctor.specialty || "Médecin généraliste"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nombres de patients:</span>
                  <span className="detail-value">{currentDoctor.patients_count || 0}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Biographie:</span>
                  <div className="detail-value text-block">
                    {currentDoctor.bio || "Aucune biographie renseignée"}
                  </div>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Formation:</span>
                  <div className="detail-value text-block">
                    {currentDoctor.education || "Aucune formation renseignée"}
                  </div>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Expérience:</span>
                  <div className="detail-value text-block">
                    {currentDoctor.experience || "Aucune expérience renseignée"}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Rendez-vous à venir</h4>
              {currentDoctor.upcoming_appointments && currentDoctor.upcoming_appointments.length > 0 ? (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Patient</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDoctor.upcoming_appointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>{appointment.date}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.patient_name}</td>
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
                <p className="no-data">Aucun rendez-vous à venir</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la liste des médecins
  return (
    <div className="doctors-management">
      <div className="panel-header">
        <h2>Gestion des médecins</h2>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(true)}
          disabled={actionLoading}
        >
          <i className="fas fa-user-md"></i> Ajouter un médecin
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-options">
          <button
            className={`view-option ${viewType === 'grid' ? 'active' : ''}`}
            onClick={() => setViewType('grid')}
            disabled={actionLoading}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button
            className={`view-option ${viewType === 'list' ? 'active' : ''}`}
            onClick={() => setViewType('list')}
            disabled={actionLoading}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {filteredDoctors.length > 0 ? (
        viewType === 'grid' ? (
          <div className="doctors-grid">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-avatar">
                  <i className="fas fa-user-md"></i>
                </div>
                <h3 className="doctor-name">Dr. {doctor.name}</h3>
                <p className="doctor-specialty">{doctor.specialty || "Médecin généraliste"}</p>
                <p className="doctor-email">{doctor.email}</p>
                <div className="doctor-info">
                  <p>
                    <i className="fas fa-user-injured"></i>
                    Patients: {doctor.patients_count || 0}
                  </p>
                  <p>
                    <i className="fas fa-phone"></i>
                    {doctor.phone || "Non renseigné"}
                  </p>
                </div>
                <div className="doctor-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleViewDetails(doctor)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-eye"></i> Détails
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setEditingDoctor(doctor)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-edit"></i> Modifier
                  </button>
                  <button
                    className="btn-outline danger"
                    onClick={() => handleDeleteDoctor(doctor.id)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-trash-alt"></i> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="doctors-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Spécialité</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Patients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doctor => (
                  <tr key={doctor.id} className="doctor-row">
                    <td>
                      <div className="doctor-name-cell">
                        <div className="doctor-avatar-small">
                          <i className="fas fa-user-md"></i>
                        </div>
                        <span>Dr. {doctor.name}</span>
                      </div>
                    </td>
                    <td>{doctor.specialty || "Médecin généraliste"}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.phone || "Non renseigné"}</td>
                    <td>{doctor.patients_count || 0}</td>
                    <td className="actions">
                      <button
                        className="btn-icon"
                        title="Voir détails"
                        onClick={() => handleViewDetails(doctor)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon"
                        title="Modifier"
                        onClick={() => setEditingDoctor(doctor)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon"
                        title="Supprimer"
                        onClick={() => handleDeleteDoctor(doctor.id)}
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
          <i className="fas fa-user-md"></i>
          <h3>Aucun médecin trouvé</h3>
          <p>Aucun médecin ne correspond à vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;