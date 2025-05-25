// src/components/doctor-dashboard/PatientSelector.jsx - Version avec photos de profil
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
  const [viewType, setViewType] = useState("grid");

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectPatient = (patient) => {
    handlePatientSelect(patient);
    handleSubTabChange("record");
  };

  // Composant pour l'avatar du patient avec photo de profil
  const PatientAvatar = ({ patient, size = "large" }) => {
    const sizeConfig = {
      small: { container: "w-10 h-10", icon: "text-lg" },
      medium: { container: "w-12 h-12", icon: "text-xl" },
      large: { container: "w-20 h-20", icon: "text-3xl" }
    };

    const config = sizeConfig[size] || sizeConfig.large;

    if (patient.profile_photo_url) {
      return (
        <div className={`patient-avatar ${config.container} rounded-full overflow-hidden border-3 border-white shadow-lg bg-gray-100 mx-auto`}>
          <img 
            src={patient.profile_photo_url} 
            alt={`Photo de profil de ${patient.name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback vers l'icône si l'image ne charge pas
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div 
            className={`patient-avatar-fallback ${config.container} bg-primary-light rounded-full flex items-center justify-center text-primary-color ${config.icon} mx-auto`}
            style={{ display: 'none' }}
          >
            <i className="fas fa-user-circle"></i>
          </div>
        </div>
      );
    }

    return (
      <div className={`patient-avatar ${config.container} bg-primary-light rounded-full flex items-center justify-center text-primary-color ${config.icon} border-3 border-white shadow-lg mx-auto`}>
        <i className="fas fa-user-circle"></i>
      </div>
    );
  };

  const PatientCard = ({ patient }) => (
    <div className="patient-card">
      <PatientAvatar patient={patient} size="large" />
      <h3 className="patient-name">{patient.name}</h3>
      <p className="patient-email">{patient.email}</p>
      {patient.profile_photo_url && (
        <div className="has-photo-indicator">
          <i className="fas fa-camera text-success"></i>
          <span className="text-xs text-success">Photo disponible</span>
        </div>
      )}
      <div className="patient-info">
        <p><i className="fas fa-phone"></i>{patient.phone || "Non renseigné"}</p>
        <p><i className="fas fa-calendar-alt"></i>Dernier RDV: {patient.last_appointment || "Aucun"}</p>
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
  );

  const PatientRow = ({ patient }) => (
    <tr className="patient-row">
      <td>
        <div className="patient-name-cell">
          <PatientAvatar patient={patient} size="medium" />
          <div className="patient-name-info ml-3">
            <span className="patient-name-text">{patient.name}</span>
            {patient.profile_photo_url && (
              <div className="has-photo-indicator">
                <i className="fas fa-camera text-success"></i>
                <span className="text-xs text-success">Photo</span>
              </div>
            )}
          </div>
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
  );

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

      {/* Statistiques des photos */}
      <div className="patients-stats">
        <div className="stat-item">
          <span className="stat-label">Total patients:</span>
          <span className="stat-value">{filteredPatients.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avec photo:</span>
          <span className="stat-value text-success">
            {filteredPatients.filter(p => p.profile_photo_url).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sans photo:</span>
          <span className="stat-value text-warning">
            {filteredPatients.filter(p => !p.profile_photo_url).length}
          </span>
        </div>
      </div>

      {filteredPatients.length > 0 ? (
        viewType === 'grid' ? (
          <div className="patients-grid">
            {filteredPatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          <div className="patients-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Dernier RDV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
                  <PatientRow key={patient.id} patient={patient} />
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