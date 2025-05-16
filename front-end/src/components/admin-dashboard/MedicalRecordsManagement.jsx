// src/components/admin-dashboard/MedicalRecordsManagement.jsx
import React, { useState } from "react";

const MedicalRecordsManagement = ({
  medicalRecords = [],
  patients = [],
  doctors = [],
  actionLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    patient: "",
    doctor: "",
    type: "",
    dateFrom: "",
    dateTo: "",
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

      {/* Filtres avancés (initialement cachés) */}
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

      {/* Tableau des dossiers médicaux */}
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
    </div>
  );
};

export default MedicalRecordsManagement;
