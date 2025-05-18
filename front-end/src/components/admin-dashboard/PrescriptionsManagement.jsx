// src/components/admin-dashboard/PrescriptionsManagement.jsx
import React, { useState } from "react";

const PrescriptionsManagement = ({
  prescriptions = [],
  patients = [],
  doctors = [],
  actionLoading,
  handleAddPrescription,
  handleUpdatePrescription,
  handleDeletePrescription
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  // Formulaire pour l'ajout/modification de prescription
  const emptyPrescription = {
    patient_id: "",
    doctor_id: "",
    medical_record_id: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    medications: [
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      }
    ]
  };
  
  const [formData, setFormData] = useState(emptyPrescription);
  
 // Filtrer les prescriptions selon le terme de recherche
const filteredPrescriptions = prescriptions.filter(prescription => {
  return (
    (prescription.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (prescription.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    ((prescription.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );
});
  
  // Gérer les changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements dans les médicaments
  const handleMedicationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };
  
  // Ajouter un nouveau médicament vide
  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: ""
        }
      ]
    }));
  };
  
  // Supprimer un médicament
  const removeMedication = (index) => {
    const updatedMedications = [...formData.medications];
    updatedMedications.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };
  
  // Démarrer l'édition d'une prescription
  const startEditing = (prescription) => {
    // Récupérer les détails complets de la prescription
    // Ceci serait idéalement une requête API pour obtenir tous les détails
    // Pour l'exemple, on utilise simplement les données disponibles
    setFormData({
      patient_id: prescription.patient_id.toString(),
      doctor_id: prescription.doctor_id.toString(),
      medical_record_id: prescription.medical_record_id?.toString() || "",
      date: prescription.date,
      notes: prescription.notes || "",
      medications: prescription.medications || []
    });
    
    setEditingPrescription(prescription.id);
    setShowAddForm(true);
  };
  
  // Annuler l'édition ou l'ajout
  const cancelForm = () => {
    setFormData(emptyPrescription);
    setEditingPrescription(null);
    setShowAddForm(false);
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingPrescription) {
      // Mise à jour d'une prescription existante
      handleUpdatePrescription(editingPrescription, formData);
    } else {
      // Ajout d'une nouvelle prescription
      handleAddPrescription(formData);
    }
    
    // Réinitialiser le formulaire après soumission
    cancelForm();
  };
  
  // Confirmer la suppression d'une prescription
  const confirmDelete = (id, patientName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette prescription pour ${patientName} ?`)) {
      handleDeletePrescription(id);
      
      // Si la prescription supprimée était sélectionnée, désélectionner
      if (selectedPrescription && selectedPrescription.id === id) {
        setSelectedPrescription(null);
      }
    }
  };
  
  // Afficher les détails d'une prescription
  const viewPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowAddForm(false);
  };
  
  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="prescriptions-management">
      {/* En-tête avec recherche et bouton d'ajout */}
      <div className="data-table-header">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher une prescription..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            setFormData(emptyPrescription);
            setEditingPrescription(null);
            setSelectedPrescription(null);
            setShowAddForm(true);
          }}
          disabled={actionLoading}
        >
          <i className="fas fa-prescription"></i> Nouvelle ordonnance
        </button>
      </div>
      
      {/* Affichage des détails d'une prescription sélectionnée */}
      {selectedPrescription && !showAddForm && (
        <div className="prescription-details">
          <div className="details-header">
            <h3>Détails de l'ordonnance</h3>
            <div className="header-actions">
              <button
                className="btn-outline"
                onClick={() => startEditing(selectedPrescription)}
                disabled={actionLoading}
              >
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button
                className="btn-danger"
                onClick={() => confirmDelete(selectedPrescription.id, selectedPrescription.patient_name)}
                disabled={actionLoading}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedPrescription(null)}
                disabled={actionLoading}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
            </div>
          </div>
          
          <div className="details-content">
            <div className="details-section">
              <h4>Informations générales</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-label">Patient:</div>
                  <div className="detail-value">{selectedPrescription.patient_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Médecin:</div>
                  <div className="detail-value">{selectedPrescription.doctor_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Date:</div>
                  <div className="detail-value">{formatDate(selectedPrescription.date)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Nombre de médicaments:</div>
                  <div className="detail-value">{selectedPrescription.medication_count}</div>
                </div>
              </div>
            </div>
            
            <div className="details-section">
              <h4>Notes</h4>
              <div className="detail-notes">
                {selectedPrescription.notes || "Aucune note"}
              </div>
            </div>
            
            {/* Si les médicaments sont disponibles, les afficher */}
            {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
              <div className="details-section">
                <h4>Médicaments prescrits</h4>
                <table className="medications-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Dosage</th>
                      <th>Fréquence</th>
                      <th>Durée</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.medications.map((medication, index) => (
                      <tr key={index}>
                        <td>{medication.name}</td>
                        <td>{medication.dosage}</td>
                        <td>{medication.frequency}</td>
                        <td>{medication.duration}</td>
                        <td>{medication.instructions || "Aucune instruction spécifique"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="form-container">
          <h3>{editingPrescription ? "Modifier l'ordonnance" : "Nouvelle ordonnance"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Informations générales</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="patient_id">Patient *</label>
                  <select
                    id="patient_id"
                    name="patient_id"
                    className="form-control"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="doctor_id">Médecin *</label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    className="form-control"
                    value={formData.doctor_id}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  >
                    <option value="">Sélectionner un médecin</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="medical_record_id">Dossier médical associé (optionnel)</label>
                  <input
                    type="text"
                    id="medical_record_id"
                    name="medical_record_id"
                    className="form-control"
                    value={formData.medical_record_id}
                    onChange={handleChange}
                    disabled={actionLoading}
                    placeholder="ID du dossier médical"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes (optionnel)</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                  placeholder="Notes supplémentaires concernant cette ordonnance"
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <h4>Médicaments</h4>
                <button 
                  type="button" 
                  className="btn-outline"
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
                        className="btn-icon danger"
                        onClick={() => removeMedication(index)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`medication-name-${index}`}>Nom *</label>
                      <input
                        type="text"
                        id={`medication-name-${index}`}
                        name="name"
                        className="form-control"
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, e)}
                        required
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`medication-dosage-${index}`}>Dosage *</label>
                      <input
                        type="text"
                        id={`medication-dosage-${index}`}
                        name="dosage"
                        className="form-control"
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, e)}
                        required
                        disabled={actionLoading}
                        placeholder="Ex: 500mg"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`medication-frequency-${index}`}>Fréquence *</label>
                      <input
                        type="text"
                        id={`medication-frequency-${index}`}
                        name="frequency"
                        className="form-control"
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, e)}
                        required
                        disabled={actionLoading}
                        placeholder="Ex: 3 fois par jour"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`medication-duration-${index}`}>Durée *</label>
                      <input
                        type="text"
                        id={`medication-duration-${index}`}
                        name="duration"
                        className="form-control"
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, e)}
                        required
                        disabled={actionLoading}
                        placeholder="Ex: 7 jours"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`medication-instructions-${index}`}>Instructions (optionnel)</label>
                    <textarea
                      id={`medication-instructions-${index}`}
                      name="instructions"
                      className="form-control"
                      value={medication.instructions}
                      onChange={(e) => handleMedicationChange(index, e)}
                      rows="2"
                      disabled={actionLoading}
                      placeholder="Instructions spéciales pour ce médicament"
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
                {actionLoading ? (
                  <span><i className="loading-spinner"></i> Traitement...</span>
                ) : (
                  <span><i className="fas fa-save"></i> {editingPrescription ? "Mettre à jour" : "Enregistrer"}</span>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={cancelForm}
                disabled={actionLoading}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Tableau des prescriptions */}
      {!showAddForm && !selectedPrescription && (
        <div className="data-table-container">
          {filteredPrescriptions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Médicaments</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map(prescription => (
                  <tr key={prescription.id}>
                    <td>{formatDate(prescription.date)}</td>
                    <td>{prescription.patient_name}</td>
                    <td>{prescription.doctor_name}</td>
                    <td>{prescription.medication_count}</td>
                    <td>
                      {prescription.notes
                        ? prescription.notes.length > 30
                          ? `${prescription.notes.substring(0, 30)}...`
                          : prescription.notes
                        : "Aucune note"}
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-icon" 
                        title="Voir les détails" 
                        onClick={() => viewPrescriptionDetails(prescription)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Modifier" 
                        onClick={() => startEditing(prescription)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer" 
                        onClick={() => confirmDelete(prescription.id, prescription.patient_name)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-prescription"></i>
              <h3>Aucune ordonnance trouvée</h3>
              <p>Ajoutez de nouvelles ordonnances ou modifiez votre recherche</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionsManagement;