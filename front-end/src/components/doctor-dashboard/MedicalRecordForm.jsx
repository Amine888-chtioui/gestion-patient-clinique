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
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // État local pour le chargement du formulaire

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    let newErrors = {};
    
    // Validation des fichiers
    const validFiles = files.filter(file => {
      // Taille maximale (10 Mo)
      const maxSize = 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        newErrors[file.name] = `Le fichier ${file.name} dépasse la taille maximale de 10 Mo.`;
        return false;
      }
      
      // Vérifier les types de fichiers autorisés (optionnel)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        newErrors[file.name] = `Le type de fichier ${file.type} n'est pas autorisé.`;
        return false;
      }
      
      return true;
    });
    
    // Mise à jour des erreurs
    if (Object.keys(newErrors).length > 0) {
      setFileErrors(newErrors);
      setTimeout(() => {
        setFileErrors({});
      }, 5000);
    }
    
    // Ajout des fichiers valides
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    // Supprimer également le progress
    const newProgress = { ...uploadProgress };
    delete newProgress[index];
    setUploadProgress(newProgress);
  };

  // Simulation de l'upload des fichiers (dans une application réelle, cela serait géré par le backend)
  const simulateFileUpload = (file, index) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        
        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
          setTimeout(() => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size
            });
          }, 500);
        }
        
        setUploadProgress(prev => ({
          ...prev,
          [index]: progress
        }));
      }, 200);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Utiliser l'état local pour désactiver le bouton de soumission
    setIsSubmitting(true);
    
    try {
      // Simuler l'upload de tous les fichiers
      const uploadPromises = selectedFiles.map((file, index) => 
        simulateFileUpload(file, index)
      );
      
      // Attendre que tous les uploads soient terminés
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Préparation des données pour l'envoi
      const recordData = {
        ...formData,
        documents: uploadedFiles
      };
      
      // Envoi des données au backend
      handleCreateMedicalRecord(recordData);
      
    } catch (error) {
      console.error("Erreur lors de l'upload des fichiers:", error);
      // En cas d'erreur, le composant parent gérera la notification
      setIsSubmitting(false); // Réactiver le bouton si erreur
    }
  };

  // Fonction utilitaire pour déterminer l'icône en fonction du type de fichier
  const getFileIcon = (type) => {
    if (!type) return 'fa-file';
    
    type = type.toLowerCase();
    
    if (type.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (type.includes('image')) {
      return 'fa-file-image';
    } else if (type.includes('word') || type.includes('doc')) {
      return 'fa-file-word';
    } else if (type.includes('excel') || type.includes('sheet')) {
      return 'fa-file-excel';
    } else if (type.includes('text') || type.includes('txt')) {
      return 'fa-file-alt';
    } else {
      return 'fa-file';
    }
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
                      disabled={actionLoading || isSubmitting}
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
                      disabled={actionLoading || isSubmitting}
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
                    disabled={actionLoading || isSubmitting}
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
                    disabled={actionLoading || isSubmitting}
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
                      disabled={actionLoading || isSubmitting}
                    />
                    <label htmlFor="documents" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Choisir des fichiers
                    </label>
                    <span className="file-info-text">Max: 10 Mo. Formats: PDF, Images, DOC, XLS, TXT</span>
                  </div>
                  
                  {/* Affichage des erreurs de fichiers */}
                  {Object.keys(fileErrors).length > 0 && (
                    <div className="file-errors">
                      {Object.values(fileErrors).map((error, index) => (
                        <div key={index} className="file-error-message">
                          <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Liste des fichiers sélectionnés */}
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      <p className="files-header">Fichiers sélectionnés:</p>
                      <ul className="files-list">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="file-item">
                            <div className="file-info">
                              <i className={`fas ${getFileIcon(file.type)}`}></i>
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">({Math.round(file.size / 1024)} KB)</span>
                            </div>
                            
                            {/* Barre de progression pour l'upload */}
                            {uploadProgress[index] !== undefined && (
                              <div className="file-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${uploadProgress[index]}%` }}
                                ></div>
                                <span className="progress-text">{uploadProgress[index]}%</span>
                              </div>
                            )}
                            
                            {/* Bouton de suppression */}
                            {!actionLoading && !isSubmitting && (
                              <button 
                                type="button" 
                                className="btn-icon" 
                                onClick={() => removeFile(index)}
                                disabled={actionLoading || isSubmitting}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
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
              disabled={actionLoading || isSubmitting}
            >
              {actionLoading || isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Création en cours...
                </>
              ) : (
                "Créer le dossier médical"
              )}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleCancel}
              disabled={actionLoading || isSubmitting}
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