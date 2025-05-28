// src/components/admin-dashboard/MedicalRecordsManagement.jsx - Version complète avec édition et notifications
import React, { useState } from "react";

const MedicalRecordsManagement = ({
  medicalRecords = [],
  patients = [],
  doctors = [],
  actionLoading,
  handleUpdateMedicalRecord, // NOUVEAU PROP
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    patient: "",
    doctor: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  // NOUVEAU: États pour l'édition
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    type: "",
    diagnosis: "",
    notes: ""
  });

  // Fonction pour appliquer les filtres
  const applyFilters = (record) => {
    // Recherche par terme (patient, médecin, diagnostic)
    const searchMatch =
      !searchTerm ||
      (record.patient_name &&
        record.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.doctor_name &&
        record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.diagnosis &&
        record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtre par patient
    const patientMatch =
      !filterOptions.patient ||
      record.patient_id === parseInt(filterOptions.patient);

    // Filtre par médecin
    const doctorMatch =
      !filterOptions.doctor ||
      record.doctor_id === parseInt(filterOptions.doctor);

    // Filtre par type
    const typeMatch = !filterOptions.type || record.type === filterOptions.type;

    // Filtre par date (de)
    const dateFromMatch =
      !filterOptions.dateFrom || record.date >= filterOptions.dateFrom;

    // Filtre par date (à)
    const dateToMatch =
      !filterOptions.dateTo || record.date <= filterOptions.dateTo;

    return (
      searchMatch &&
      patientMatch &&
      doctorMatch &&
      typeMatch &&
      dateFromMatch &&
      dateToMatch
    );
  };

  // Appliquer les filtres à la liste des dossiers médicaux
  const filteredRecords = medicalRecords.filter(applyFilters);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterOptions({
      patient: "",
      doctor: "",
      type: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Gérer les changements dans les options de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // NOUVEAU: Démarrer l'édition d'un dossier
  const startEditing = (record) => {
    setEditFormData({
      patient_id: record.patient_id.toString(),
      doctor_id: record.doctor_id.toString(),
      date: record.date,
      type: record.type,
      diagnosis: record.diagnosis,
      notes: record.notes || ""
    });
    setEditingRecord(record.id);
    setShowEditForm(true);
  };

  // NOUVEAU: Annuler l'édition
  const cancelEdit = () => {
    setEditFormData({
      patient_id: "",
      doctor_id: "",
      date: "",
      type: "",
      diagnosis: "",
      notes: ""
    });
    setEditingRecord(null);
    setShowEditForm(false);
  };

  // NOUVEAU: Gérer les changements dans le formulaire d'édition
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NOUVEAU: Soumettre les modifications
  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    if (handleUpdateMedicalRecord) {
      handleUpdateMedicalRecord(editingRecord, editFormData);
    }
    
    // Réinitialiser après soumission
    cancelEdit();
  };

  // NOUVEAU: Helper pour afficher les infos de notification
  const showNotificationInfo = () => {
    return (
      <div className="notification-info">
        <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
          <i className="fas fa-info-circle"></i> 📩 Le patient et le médecin concernés recevront une notification de modification
        </small>
      </div>
    );
  };

  // Types de consultation (pour le filtre)
  const recordTypes = [
    { value: "consultation", label: "Consultation" },
    { value: "analyse", label: "Analyse/Examen" },
    { value: "chirurgie", label: "Intervention chirurgicale" },
    { value: "suivi", label: "Consultation de suivi" },
    { value: "autre", label: "Autre" },
  ];

  // Afficher les détails d'un dossier médical
  const viewRecordDetails = (record) => {
    // Cette fonction pourrait ouvrir une modal avec les détails du dossier
    alert(
      `Fonctionnalité en développement: Voir les détails du dossier ${record.id}`
    );
  };

  return (
    <div className="medical-records-management">
      {/* En-tête avec recherche et filtres avancés */}
      {!showEditForm && (
        <div className="data-table-header">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn-outline"
            onClick={() =>
              document.getElementById("advanced-filters").classList.toggle("show")
            }
          >
            <i className="fas fa-filter"></i> Filtres avancés
          </button>
        </div>
      )}

      {/* NOUVEAU: Formulaire d'édition */}
      {showEditForm && (
        <div className="form-container">
          <h3>Modifier le dossier médical</h3>
          <form onSubmit={handleEditSubmit}>
            <div className="form-section">
              <h4>Informations du dossier</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_patient_id">Patient *</label>
                  <select
                    id="edit_patient_id"
                    name="patient_id"
                    className="form-control"
                    value={editFormData.patient_id}
                    onChange={handleEditFormChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_doctor_id">Médecin *</label>
                  <select
                    id="edit_doctor_id"
                    name="doctor_id"
                    className="form-control"
                    value={editFormData.doctor_id}
                    onChange={handleEditFormChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un médecin</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_date">Date *</label>
                  <input
                    type="date"
                    id="edit_date"
                    name="date"
                    className="form-control"
                    value={editFormData.date}
                    onChange={handleEditFormChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_type">Type *</label>
                  <select
                    id="edit_type"
                    name="type"
                    className="form-control"
                    value={editFormData.type}
                    onChange={handleEditFormChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un type</option>
                    {recordTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit_diagnosis">Diagnostic *</label>
                <textarea
                  id="edit_diagnosis"
                  name="diagnosis"
                  className="form-control"
                  value={editFormData.diagnosis}
                  onChange={handleEditFormChange}
                  required
                  disabled={actionLoading}
                  rows="3"
                  placeholder="Diagnostic médical..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_notes">Notes</label>
                <textarea
                  id="edit_notes"
                  name="notes"
                  className="form-control"
                  value={editFormData.notes}
                  onChange={handleEditFormChange}
                  disabled={actionLoading}
                  rows="3"
                  placeholder="Notes supplémentaires..."
                />
              </div>

              {/* Info notification */}
              {editFormData.patient_id && editFormData.doctor_id && showNotificationInfo()}
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span><i className="loading-spinner"></i> Traitement...</span>
                ) : (
                  <span><i className="fas fa-save"></i> Mettre à jour</span>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={cancelEdit}
                disabled={actionLoading}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres avancés (initialement cachés) */}
      {!showEditForm && (
        <div
          id="advanced-filters"
          className="advanced-filters"
          style={{ display: "block", marginBottom: "20px" }}
        >
          <div
            className="filters-container"
            style={{
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              className="filter-grid"
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "flex-end",
                gap: "15px",
              }}
            >
              <div className="filter-item">
                <label htmlFor="patient">Patient</label>
                <select
                  id="patient"
                  name="patient"
                  className="form-control"
                  value={filterOptions.patient}
                  onChange={handleFilterChange}
                  disabled={actionLoading}
                >
                  <option value="">Tous les patients</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="doctor">Médecin</label>
                <select
                  id="doctor"
                  name="doctor"
                  className="form-control"
                  value={filterOptions.doctor}
                  onChange={handleFilterChange}
                  disabled={actionLoading}
                >
                  <option value="">Tous les médecins</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="type">Type de consultation</label>
                <select
                  id="type"
                  name="type"
                  className="form-control"
                  value={filterOptions.type}
                  onChange={handleFilterChange}
                  disabled={actionLoading}
                >
                  <option value="">Tous les types</option>
                  {recordTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="dateFrom">Date de (début)</label>
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  className="form-control"
                  value={filterOptions.dateFrom}
                  onChange={handleFilterChange}
                  disabled={actionLoading}
                />
              </div>

              <div className="filter-item">
                <label htmlFor="dateTo">Date à (fin)</label>
                <input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  className="form-control"
                  value={filterOptions.dateTo}
                  onChange={handleFilterChange}
                  disabled={actionLoading}
                />
              </div>

              <button
                className="btn-secondary"
                onClick={resetFilters}
                disabled={actionLoading}
                style={{ marginLeft: "auto", height: "40px" }}
              >
                <i className="fas fa-sync-alt"></i> Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des dossiers médicaux */}
      {!showEditForm && (
        <div className="data-table-container">
          {filteredRecords.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Type</th>
                  <th>Diagnostic</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.patient_name}</td>
                    <td>{record.doctor_name}</td>
                    <td>
                      {recordTypes.find((t) => t.value === record.type)?.label ||
                        record.type}
                    </td>
                    <td
                      style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record.diagnosis || "Non spécifié"}
                    </td>
                    <td>
                      {record.documents && record.documents.length > 0 ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#e6f5f5",
                            color: "#2a8d8e",
                            padding: "3px 8px",
                            borderRadius: "50px",
                            fontSize: "0.8rem",
                          }}
                        >
                          {record.documents.length} document(s)
                        </span>
                      ) : (
                        "Aucun"
                      )}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-icon"
                        title="Voir les détails"
                        onClick={() => viewRecordDetails(record)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon"
                        title="Modifier"
                        onClick={() => startEditing(record)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-file-medical-alt"></i>
              <h3>Aucun dossier médical trouvé</h3>
              <p>
                Modifiez vos critères de recherche ou ajoutez de nouveaux dossiers
              </p>
            </div>
          )}
        </div>
      )}

      {/* Styles CSS pour les notifications */}
      <style jsx>{`
        .notification-info {
          margin: 10px 0;
          padding: 8px 12px;
          background-color: rgba(23, 162, 184, 0.1);
          border-left: 3px solid #17a2b8;
          border-radius: 4px;
        }

        .notification-info small {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #495057;
        }

        .notification-info i {
          color: #17a2b8;
        }
      `}</style>
    </div>
  );
};

export default MedicalRecordsManagement;