// src/components/doctor-dashboard/DoctorPatients.jsx
import React, { useState } from "react";

const DoctorPatients = ({ patients, handlePatientSelect, actionLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("grid"); // "grid" ou "list"

  // Filtrer les patients par le terme de recherche
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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