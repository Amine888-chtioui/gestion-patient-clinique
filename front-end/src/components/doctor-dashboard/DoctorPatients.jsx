// src/components/doctor-dashboard/DoctorPatients.jsx - Version avec photos de profil
import React, { useState } from "react";

const DoctorPatients = ({ patients, handlePatientSelect, actionLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("grid"); // "grid" ou "list"

  // Filtrer les patients par le terme de recherche
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Composant pour l'avatar du patient avec photo de profil
  const PatientAvatar = ({ patient, size = "large" }) => {
    const sizeClasses = {
      small: "w-8 h-8 text-sm",
      medium: "w-12 h-12 text-base", 
      large: "w-20 h-20 text-3xl"
    };

    if (patient.profile_photo_url) {
      return (
        <div className={`patient-avatar ${sizeClasses[size]} rounded-full overflow-hidden border-3 border-white shadow-lg`}>
          <img 
            src={patient.profile_photo_url} 
            alt={`Photo de ${patient.name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback vers l'icône si l'image ne charge pas
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="patient-avatar-fallback" style={{ display: 'none' }}>
            <i className="fas fa-user-circle"></i>
          </div>
        </div>
      );
    }

    return (
      <div className={`patient-avatar ${sizeClasses[size]} bg-primary-light rounded-full flex items-center justify-center text-primary-color`}>
        <i className="fas fa-user-circle"></i>
      </div>
    );
  };

  return (
    <div className="patients-container">
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
                <PatientAvatar patient={patient} size="large" />
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
                    onClick={() => handlePatientSelect(patient)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-eye"></i> Voir dossier
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
                  <th>Patient</th>
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
                        <PatientAvatar patient={patient} size="medium" />
                        <div className="patient-name-info">
                          <span className="patient-name-text">{patient.name}</span>
                          {patient.profile_photo_url && (
                            <span className="has-photo-indicator">
                              <i className="fas fa-camera text-success"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || "Non renseigné"}</td>
                    <td>{patient.last_appointment || "Aucun"}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        title="Voir dossier"
                        onClick={() => handlePatientSelect(patient)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Créer dossier médical"
                        onClick={() => {
                          handlePatientSelect(patient);
                          // Idéalement, nous voudrions aussi passer à l'onglet de création de dossier
                        }}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-file-medical"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Créer ordonnance"
                        onClick={() => {
                          handlePatientSelect(patient);
                          // Idéalement, nous voudrions aussi passer à l'onglet de création d'ordonnance
                        }}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-prescription"></i>
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

export default DoctorPatients;