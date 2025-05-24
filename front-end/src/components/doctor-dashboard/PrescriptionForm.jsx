// src/components/doctor-dashboard/PrescriptionForm.jsx - Version mise à jour
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const PrescriptionForm = ({
  patient,
  handleCreatePrescription,
  handleCancel,
  actionLoading
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    medical_record_id: "", // Obligatoire maintenant
    notes: "",
    medications: [
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]
  });

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState(null);

  // Charger les dossiers médicaux du patient
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!patient?.id) return;
      
      try {
        setLoadingRecords(true);
        const response = await axios.get(`/api/doctor/patients/${patient.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        // Récupérer les dossiers médicaux du patient
        const records = response.data.patient.medical_records || [];
        setMedicalRecords(records);
        
        // Sélectionner automatiquement le dossier le plus récent s'il existe
        if (records.length > 0) {
          const latestRecord = records.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          setFormData(prev => ({
            ...prev,
            medical_record_id: latestRecord.id.toString()
          }));
        }
        
      } catch (err) {
        console.error("Erreur lors du chargement des dossiers médicaux:", err);
        setRecordsError("Impossible de charger les dossiers médicaux du patient.");
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchMedicalRecords();
  }, [patient?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index][field] = value;
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
      ]
    });
  };

  const removeMedication = (index) => {
    if (formData.medications.length === 1) {
      return; // Ne pas supprimer le dernier médicament
    }
    
    const updatedMedications = [...formData.medications];
    updatedMedications.splice(index, 1);
    
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation : s'assurer qu'un dossier médical est sélectionné
    if (!formData.medical_record_id) {
      alert("Veuillez sélectionner un dossier médical pour cette ordonnance.");
      return;
    }
    
    handleCreatePrescription(formData);
  };

  const handleCreateNewRecord = () => {
    // Rediriger vers la création d'un nouveau dossier médical
    if (window.confirm("Aucun dossier médical trouvé pour ce patient. Voulez-vous en créer un nouveau ?")) {
      // Cette fonction devrait être passée en props depuis le parent
      // pour rediriger vers la création d'un dossier médical
      handleCancel(); // Pour l'instant, on annule
    }
  };

  return (
    <div className="prescription-container">
      <div className="form-content">
        <div className="form-header">
          <div className="patient-info">
            <h3>Créer une ordonnance</h3>
            <div className="patient-details">
              <span className="patient-name">Patient: <strong>{patient.name}</strong></span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="prescription-form">
          <div className="form-grid">
            <div className="form-main">
              <div className="form-section">
                <h4>Informations générales</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date de l'ordonnance</label>
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
                </div>

                {/* NOUVEAU : Sélection du dossier médical obligatoire */}
                <div className="form-group">
                  <label htmlFor="medical_record_id">
                    Dossier médical associé <span className="required">*</span>
                  </label>
                  {loadingRecords ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i> Chargement des dossiers...
                    </div>
                  ) : recordsError ? (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {recordsError}
                    </div>
                  ) : medicalRecords.length === 0 ? (
                    <div className="no-records-message">
                      <p>Aucun dossier médical trouvé pour ce patient.</p>
                      <button 
                        type="button" 
                        className="btn-outline"
                        onClick={handleCreateNewRecord}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-plus"></i> Créer un dossier médical
                      </button>
                    </div>
                  ) : (
                    <select
                      id="medical_record_id"
                      name="medical_record_id"
                      value={formData.medical_record_id}
                      onChange={handleChange}
                      required
                      disabled={actionLoading}
                    >
                      <option value="">-- Sélectionnez un dossier médical --</option>
                      {medicalRecords.map(record => (
                        <option key={record.id} value={record.id}>
                          {new Date(record.date).toLocaleDateString('fr-FR')} - {record.type} - {record.diagnosis}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className="form-help">
                    L'ordonnance sera liée au dossier médical sélectionné pour assurer la traçabilité.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes générales</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Informations complémentaires pour le patient..."
                    rows="3"
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>

              <div className="form-section medications-section">
                <div className="section-header">
                  <h4>Médicaments prescrits</h4>
                  <button 
                    type="button" 
                    className="btn-add-medication"
                    onClick={addMedication}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-plus"></i> Ajouter un médicament
                  </button>
                </div>

                <div className="medications-list">
                  {formData.medications.map((medication, index) => (
                    <div key={index} className="medication-form">
                      <div className="medication-header">
                        <h5>Médicament {index + 1}</h5>
                        {formData.medications.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-icon" 
                            onClick={() => removeMedication(index)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`medication-name-${index}`}>Nom du médicament</label>
                          <input
                            type="text"
                            id={`medication-name-${index}`}
                            value={medication.name}
                            onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                            placeholder="Nom du médicament"
                            required
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`medication-dosage-${index}`}>Dosage</label>
                          <input
                            type="text"
                            id={`medication-dosage-${index}`}
                            value={medication.dosage}
                            onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                            placeholder="Ex: 500mg, 5ml, etc."
                            required
                            disabled={actionLoading}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`medication-frequency-${index}`}>Fréquence</label>
                          <input
                            type="text"
                            id={`medication-frequency-${index}`}
                            value={medication.frequency}
                            onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                            placeholder="Ex: 3 fois par jour, tous les matins, etc."
                            required
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`medication-duration-${index}`}>Durée du traitement</label>
                          <input
                            type="text"
                            id={`medication-duration-${index}`}
                            value={medication.duration}
                            onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                            placeholder="Ex: 7 jours, 2 semaines, etc."
                            required
                            disabled={actionLoading}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`medication-instructions-${index}`}>Instructions spécifiques</label>
                        <textarea
                          id={`medication-instructions-${index}`}
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                          placeholder="Précisions sur la prise du médicament (à prendre pendant les repas, etc.)"
                          rows="2"
                          disabled={actionLoading}
                        ></textarea>
                      </div>
                    </div>
                  ))}
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
                
                <div className="warning-box">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>
                    Veuillez vérifier attentivement les allergies du patient et les
                    interactions médicamenteuses potentielles avant de prescrire.
                  </p>
                </div>

                {/* Affichage des informations du dossier médical sélectionné */}
                {formData.medical_record_id && medicalRecords.length > 0 && (
                  <div className="selected-record-info">
                    <h4>Dossier médical sélectionné</h4>
                    {(() => {
                      const selectedRecord = medicalRecords.find(r => r.id.toString() === formData.medical_record_id);
                      return selectedRecord ? (
                        <div className="record-summary">
                          <p><strong>Date:</strong> {new Date(selectedRecord.date).toLocaleDateString('fr-FR')}</p>
                          <p><strong>Type:</strong> {selectedRecord.type}</p>
                          <p><strong>Diagnostic:</strong> {selectedRecord.diagnosis}</p>
                          {selectedRecord.notes && (
                            <p><strong>Notes:</strong> {selectedRecord.notes.substring(0, 100)}...</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={actionLoading || !formData.medical_record_id}
            >
              {actionLoading ? "Création en cours..." : "Créer l'ordonnance"}
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

export default PrescriptionForm;