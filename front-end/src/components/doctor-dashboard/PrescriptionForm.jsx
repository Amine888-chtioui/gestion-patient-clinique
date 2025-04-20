// src/components/doctor-dashboard/PrescriptionForm.jsx
import React, { useState } from "react";

const PrescriptionForm = ({
  patient,
  handleCreatePrescription,
  handleCancel,
  actionLoading
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    notes: "",
    medications: [
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]
  });

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
    handleCreatePrescription(formData);
  };

  return (
    <div className="prescription-form-container">
      <div className="form-header">
        <div className="patient-info">
          <h3>Créer une ordonnance</h3>
          <p>Patient: <strong>{patient.name}</strong></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="prescription-form">
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

        <div className="form-section">
          <div className="section-header">
            <h4>Médicaments prescrits</h4>
            <button 
              type="button" 
              className="btn-sm btn-outline"
              onClick={addMedication}
              disabled={actionLoading}
            >
              <i className="fas fa-plus"></i> Ajouter un médicament
            </button>
          </div>

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

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={actionLoading}
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
      </div>
    </div>
  );
};

export default PrescriptionForm;