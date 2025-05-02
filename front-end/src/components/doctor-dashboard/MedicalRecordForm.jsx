// src/components/doctor-dashboard/MedicalRecordForm.jsx
import React, { useState } from "react";

const MedicalRecordForm = ({ 
  patient, 
  appointment, 
  handleCreateMedicalRecord, 
  handleCancel,
  actionLoading 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    type: appointment ? "consultation" : "consultation",
    diagnosis: "",
    notes: "",
    documents: []
  });

  // État pour la gestion des fichiers
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Préparation des données pour l'envoi
    const recordData = {
      ...formData,
      // Métadonnées des fichiers pour simulation
      documents: selectedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };
    
    handleCreateMedicalRecord(recordData);
  };

  return (
    <div className="medical-record-container">
      <div className="form-content">
        <div className="form-header">
          <div className="patient-info">
            <h3>Créer un dossier médical</h3>
            <div className="patient-details">
              <span className="patient-name">Patient: <strong>{patient.name}</strong></span>
              {appointment && (
                <span className="appointment-details">Rendez-vous du <strong>{appointment.date}</strong> à <strong>{appointment.time}</strong></span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="medical-record-form">
          <div className="form-grid">
            <div className="form-main">
              <div className="form-section">
                <h4>Informations générales</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date de consultation</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Type de consultation</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={actionLoading}
                    >
                      <option value="consultation">Consultation normale</option>
                      <option value="analyse">Analyse/Examen</option>
                      <option value="chirurgie">Intervention chirurgicale</option>
                      <option value="suivi">Consultation de suivi</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="diagnosis">Diagnostic</label>
                  <input
                    type="text"
                    id="diagnosis"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    placeholder="Diagnostic principal"
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes et observations</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Observations, symptômes, traitements recommandés..."
                    rows="5"
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>

              <div className="form-section">
                <h4>Documents associés</h4>
                
                <div className="form-group">
                  <label htmlFor="documents">Ajouter des documents (résultats d'analyse, images, etc.)</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="documents"
                      onChange={handleFileChange}
                      multiple
                      className="file-input"
                      disabled={actionLoading}
                    />
                    <label htmlFor="documents" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Choisir des fichiers
                    </label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      <p className="files-header">Fichiers sélectionnés:</p>
                      <ul className="files-list">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="file-item">
                            <div className="file-info">
                              <i className={`fas fa-file${file.type.includes('image') ? '-image' : file.type.includes('pdf') ? '-pdf' : ''}`}></i>
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">({Math.round(file.size / 1024)} KB)</span>
                            </div>
                            <button 
                              type="button" 
                              className="btn-icon" 
                              onClick={() => removeFile(index)}
                              disabled={actionLoading}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-sidebar">
              <div className="info-panel">
                <h4>Informations patient</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Groupe sanguin:</span>
                    <span className="info-value">{patient.blood_type || "Non renseigné"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Allergies:</span>
                    <span className="info-value">
                      {patient.allergies && patient.allergies.length > 0
                        ? patient.allergies.join(", ")
                        : "Aucune allergie connue"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Maladies chroniques:</span>
                    <span className="info-value">
                      {patient.chronic_diseases && patient.chronic_diseases.length > 0
                        ? patient.chronic_diseases.join(", ")
                        : "Aucune maladie chronique connue"}
                    </span>
                  </div>
                </div>
                
                <h4>Antécédents médicaux</h4>
                <div className="medical-history">
                  {patient.medical_history || "Aucun antécédent médical renseigné"}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Création en cours..." : "Créer le dossier médical"}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordForm;