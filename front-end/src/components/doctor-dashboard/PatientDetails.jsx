// src/components/doctor-dashboard/PatientDetails.jsx
import React, { useState } from "react";

const PatientDetails = ({ patient, handleSubTabChange, actionLoading }) => {
  const [activeTab, setActiveTab] = useState("info");

  // Dans un environnement réel, ces données seraient chargées depuis l'API
  const medicalRecords = patient.medical_records || [];
  const prescriptions = patient.prescriptions || [];
  const appointments = patient.appointments || [];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="patient-details-container">
      <div className="patient-header">
        <div className="patient-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="patient-title">
          <h2>{patient.name}</h2>
          <p>{patient.email}</p>
        </div>
        <div className="patient-actions">
          <button 
            className="btn-outline"
            onClick={() => handleSubTabChange("record")}
            disabled={actionLoading}
          >
            <i className="fas fa-file-medical"></i> Nouvelle consultation
          </button>
          <button 
            className="btn-outline"
            onClick={() => handleSubTabChange("prescription")}
            disabled={actionLoading}
          >
            <i className="fas fa-prescription"></i> Nouvelle ordonnance
          </button>
        </div>
      </div>

      <div className="patient-tabs">
        <button 
          className={`patient-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => handleTabChange('info')}
        >
          <i className="fas fa-info-circle"></i> Informations
        </button>
        <button 
          className={`patient-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => handleTabChange('records')}
        >
          <i className="fas fa-file-medical"></i> Dossier médical
        </button>
        <button 
          className={`patient-tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
          onClick={() => handleTabChange('prescriptions')}
        >
          <i className="fas fa-prescription"></i> Ordonnances
        </button>
        <button 
          className={`patient-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => handleTabChange('appointments')}
        >
          <i className="fas fa-calendar-alt"></i> Rendez-vous
        </button>
      </div>

      <div className="patient-content">
        {activeTab === 'info' && (
          <div className="patient-info-tab">
            <div className="info-section">
              <h3>Informations personnelles</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nom complet</span>
                  <span className="info-value">{patient.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{patient.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Téléphone</span>
                  <span className="info-value">{patient.phone || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date de naissance</span>
                  <span className="info-value">{patient.date_of_birth || "Non renseignée"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Adresse</span>
                  <span className="info-value">{patient.address || "Non renseignée"}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Informations médicales</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Groupe sanguin</span>
                  <span className="info-value">{patient.blood_type || "Non renseigné"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Allergies</span>
                  <span className="info-value">
                    {patient.allergies && patient.allergies.length > 0
                      ? patient.allergies.join(", ")
                      : "Aucune allergie renseignée"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Maladies chroniques</span>
                  <span className="info-value">
                    {patient.chronic_diseases && patient.chronic_diseases.length > 0
                      ? patient.chronic_diseases.join(", ")
                      : "Aucune maladie chronique renseignée"}
                  </span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Contact d'urgence</span>
                  <span className="info-value">{patient.emergency_contact || "Non renseigné"}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Antécédents médicaux</span>
                  <div className="info-value-box">
                    {patient.medical_history || "Aucun antécédent médical renseigné"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="patient-records-tab">
            <h3>Dossier médical</h3>
            {medicalRecords.length > 0 ? (
              <div className="records-timeline">
                {medicalRecords.map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-date">
                      <span className="date">{record.date}</span>
                      <span className="type">{record.type}</span>
                    </div>
                    <div className="record-content">
                      <h4>Consultation avec Dr. {record.doctor_name}</h4>
                      <div className="record-details">
                        <p><strong>Diagnostic:</strong> {record.diagnosis}</p>
                        <p><strong>Notes:</strong> {record.notes}</p>
                        {record.documents && record.documents.length > 0 && (
                          <div className="record-documents">
                            <p><strong>Documents:</strong></p>
                            <ul>
                              {record.documents.map((doc, index) => (
                                <li key={index}>
                                  <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    // Fonction pour télécharger le document
                                    alert("Téléchargement du document " + doc.name);
                                  }}>
                                    <i className="fas fa-file-download"></i> {doc.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-folder-open"></i>
                <h4>Aucun dossier médical</h4>
                <p>Ce patient n'a pas encore de dossier médical</p>
                <button 
                  className="btn-primary"
                  onClick={() => handleSubTabChange("record")}
                  disabled={actionLoading}
                >
                  Créer un dossier médical
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="patient-prescriptions-tab">
            <h3>Ordonnances</h3>
            {prescriptions.length > 0 ? (
              <div className="prescriptions-list">
                {prescriptions.map(prescription => (
                  <div key={prescription.id} className="prescription-card">
                    <div className="prescription-header">
                      <h4>Ordonnance du {prescription.date}</h4>
                      <span className="prescription-doctor">Dr. {prescription.doctor_name}</span>
                    </div>
                    <div className="prescription-body">
                      <h5>Médicaments prescrits:</h5>
                      <ul className="medications-list">
                        {prescription.medications.map((med, index) => (
                          <li key={index} className="medication-item">
                            <div className="medication-name">
                              <i className="fas fa-pills"></i>
                              <span>{med.name}</span>
                            </div>
                            <div className="medication-details">
                              <span className="detail"><strong>Dosage:</strong> {med.dosage}</span>
                              <span className="detail"><strong>Fréquence:</strong> {med.frequency}</span>
                              <span className="detail"><strong>Durée:</strong> {med.duration}</span>
                              {med.instructions && (
                                <span className="detail full-width">
                                  <strong>Instructions:</strong> {med.instructions}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {prescription.notes && (
                        <div className="prescription-notes">
                          <p><strong>Notes:</strong> {prescription.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="prescription-footer">
                      <button 
                        className="btn-outline"
                        onClick={() => alert("Imprimer l'ordonnance")}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-print"></i> Imprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-prescription-bottle"></i>
                <h4>Aucune ordonnance</h4>
                <p>Ce patient n'a pas encore d'ordonnance</p>
                <button 
                  className="btn-primary"
                  onClick={() => handleSubTabChange("prescription")}
                  disabled={actionLoading}
                >
                  Créer une ordonnance
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="patient-appointments-tab">
            <h3>Historique des rendez-vous</h3>
            {appointments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.reason || "Non spécifié"}</td>
                      <td>
                        <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>{appointment.notes || "Aucune note"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-calendar-times"></i>
                <h4>Aucun rendez-vous</h4>
                <p>Ce patient n'a pas encore pris de rendez-vous</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;