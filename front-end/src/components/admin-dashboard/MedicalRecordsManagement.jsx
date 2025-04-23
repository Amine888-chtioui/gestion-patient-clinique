// src/components/admin-dashboard/MedicalRecordsManagement.jsx
import React, { useState } from "react";

const MedicalRecordsManagement = ({
  medicalRecords,
  patients,
  doctors,
  actionLoading
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentRecord, setCurrentRecord] = useState(null);

  // Filtrer les dossiers médicaux selon les critères
  const filteredRecords = medicalRecords.filter(record => {
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesDate = !filterDate || record.date === filterDate;
    const matchesSearch = !searchTerm || 
      (record.patient_name && record.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.doctor_name && record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesDate && matchesSearch;
  });

  // Si on affiche les détails d'un dossier médical
  if (currentRecord) {
    const patient = patients.find(p => p.id === currentRecord.patient_id) || {};
    const doctor = doctors.find(d => d.id === currentRecord.doctor_id) || {};

    return (
      <div className="medical-record-details-view">
        <div className="panel-header">
          <h2>Détails du dossier médical</h2>
          <button 
            className="btn-outline"
            onClick={() => setCurrentRecord(null)}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </button>
        </div>

        <div className="record-card">
          <div className="record-header">
            <div className="record-title">
              <h3>{currentRecord.type.charAt(0).toUpperCase() + currentRecord.type.slice(1)} du {currentRecord.date}</h3>
              <p>Dossier médical #{currentRecord.id}</p>
            </div>
          </div>

          <div className="record-details">
            <div className="record-participants">
              <div className="participant-card">
                <h4><i className="fas fa-user-injured"></i> Patient</h4>
                <div className="participant-info">
                  <p className="participant-name">{patient.name || currentRecord.patient_name || "Inconnu"}</p>
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
                  <p className="participant-name">Dr. {doctor.name || currentRecord.doctor_name || "Inconnu"}</p>
                  <p className="participant-detail">
                    <i className="fas fa-stethoscope"></i> {doctor.specialty || "Non spécifiée"}
                  </p>
                  <p className="participant-contact">
                    <i className="fas fa-envelope"></i> {doctor.email || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            <div className="record-section">
              <h4>Diagnostic</h4>
              <p className="record-diagnosis">
                {currentRecord.diagnosis || "Aucun diagnostic spécifié"}
              </p>
            </div>

            {currentRecord.notes && (
              <div className="record-section">
                <h4>Notes et observations</h4>
                <p className="record-notes">
                  {currentRecord.notes}
                </p>
              </div>
            )}

            {currentRecord.documents && currentRecord.documents.length > 0 && (
              <div className="record-section">
                <h4>Documents associés</h4>
                <ul className="document-list">
                  {currentRecord.documents.map((doc, index) => (
                    <li key={index} className="document-item">
                      <i className="fas fa-file-medical"></i>
                      <span className="document-name">{doc.name}</span>
                      <span className="document-type">{doc.type}</span>
                      <button className="btn-icon" title="Télécharger le document" disabled={actionLoading}>
                        <i className="fas fa-download"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="record-actions">
            <button
              className="btn-outline"
              onClick={() => window.print()}
              disabled={actionLoading}
            >
              <i className="fas fa-print"></i> Imprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la liste des dossiers médicaux
  return (
    <div className="medical-records-management">
      <div className="panel-header">
        <h2>Gestion des dossiers médicaux</h2>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            <option value="consultation">Consultation</option>
            <option value="analyse">Analyse</option>
            <option value="chirurgie">Chirurgie</option>
            <option value="suivi">Suivi</option>
            <option value="autre">Autre</option>
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
              setFilterType("all");
              setFilterDate("");
              setSearchTerm("");
            }}
            disabled={actionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="medical-records-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Diagnostic</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id} className="record-row">
                  <td>{record.date}</td>
                  <td>
                    <span className={`type-badge ${record.type}`}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </span>
                  </td>
                  <td>{record.patient_name || "Inconnu"}</td>
                  <td>{record.doctor_name || "Inconnu"}</td>
                  <td>
                    {record.diagnosis
                      ? record.diagnosis.length > 30
                        ? `${record.diagnosis.substring(0, 30)}...`
                        : record.diagnosis
                      : "Non spécifié"}
                  </td>
                  <td>
                    {record.documents && record.documents.length > 0 ? (
                      <span className="document-count">
                        <i className="fas fa-file-medical"></i> {record.documents.length}
                      </span>
                    ) : (
                      <span className="no-documents">Aucun</span>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir détails"
                      onClick={() => setCurrentRecord(record)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-icon"
                      title="Imprimer"
                      onClick={() => {
                        setCurrentRecord(record);
                        setTimeout(() => window.print(), 100);
                      }}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-print"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-file-medical-alt"></i>
          <h3>Aucun dossier médical trouvé</h3>
          <p>Aucun dossier ne correspond à vos critères de recherche</p>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsManagement;