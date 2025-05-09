// src/components/doctor-dashboard/PatientSelector.jsx
import React, { useState } from "react";

const PatientSelector = ({ 
  patients, 
  handlePatientSelect, 
  handleSubTabChange, 
  actionLoading,
  title = "Sélectionner un patient",
  subtitle = "Choisissez un patient pour créer un dossier médical"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("grid"); // "grid" ou "list"

  // Filter patients by search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle selection of a patient
  const selectPatient = (patient) => {
    handlePatientSelect(patient);
    handleSubTabChange("record");
  };

  return (
    <div className="patient-selector-container">
      <div className="section-header">
        <h2>{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
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

      {filteredPatients.length > 0 ? (
        viewType === 'grid' ? (
          <div className="patients-grid">
            {filteredPatients.map(patient => (
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
                    className="btn-primary"
                    onClick={() => selectPatient(patient)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-file-medical"></i> Créer un dossier médical
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
                  <th>Dernier RDV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
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
                    <td>{patient.last_appointment || "Aucun"}</td>
                    <td className="actions">
                      <button 
                        className="btn-primary btn-sm" 
                        onClick={() => selectPatient(patient)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-file-medical"></i> Créer dossier
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

export default PatientSelector;