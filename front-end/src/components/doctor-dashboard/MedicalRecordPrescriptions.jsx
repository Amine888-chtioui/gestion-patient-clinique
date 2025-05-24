// src/components/doctor-dashboard/MedicalRecordPrescriptions.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const MedicalRecordPrescriptions = ({ 
  medicalRecord, 
  onBack, 
  onViewPatient,
  onCreatePrescription,
  actionLoading 
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrescriptionsForMedicalRecord();
  }, [medicalRecord?.id]);

  const fetchPrescriptionsForMedicalRecord = async () => {
    if (!medicalRecord?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer toutes les prescriptions du médecin
      const response = await axios.get("/api/doctor/prescriptions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Filtrer les prescriptions liées à ce dossier médical
      const allPrescriptions = response.data.prescriptions || [];
      const filteredPrescriptions = allPrescriptions.filter(
        prescription => prescription.medical_record_id === medicalRecord.id
      );
      
      setPrescriptions(filteredPrescriptions);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des ordonnances:", err);
      setError("Impossible de charger les ordonnances liées à ce dossier médical.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des ordonnances..." color="primary" />;
  }

  return (
    <div className="medical-record-prescriptions-container">
      {/* En-tête avec informations du dossier médical */}
      <div className="section-header">
        <div className="header-left">
          <button 
            className="btn-outline btn-back"
            onClick={onBack}
            disabled={actionLoading}
          >
            <i className="fas fa-arrow-left"></i> Retour
          </button>
          <div className="header-info">
            <h2>Ordonnances du dossier médical</h2>
            <p className="header-subtitle">
              Dossier du {formatDate(medicalRecord.date)} - {medicalRecord.type} - {medicalRecord.patient_name}
            </p>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => onCreatePrescription(medicalRecord)}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Nouvelle ordonnance
        </button>
      </div>

      {/* Résumé du dossier médical */}
      <div className="medical-record-summary-card">
        <div className="summary-header">
          <div className="record-icon">
            <i className="fas fa-file-medical"></i>
          </div>
          <div className="summary-info">
            <h3>Dossier médical de référence</h3>
            <div className="record-details">
              <span className="record-type">{medicalRecord.type}</span>
              <span className="record-date">{formatDate(medicalRecord.date)}</span>
            </div>
          </div>
        </div>
        <div className="summary-content">
          <div className="detail-row">
            <strong>Patient:</strong> {medicalRecord.patient_name}
          </div>
          <div className="detail-row">
            <strong>Diagnostic:</strong> {medicalRecord.diagnosis}
          </div>
          {medicalRecord.notes && (
            <div className="detail-row">
              <strong>Notes:</strong> {medicalRecord.notes}
            </div>
          )}
        </div>
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Liste des ordonnances */}
      <div className="prescriptions-content">
        {prescriptions.length > 0 ? (
          <div className="prescriptions-list">
            <h3>Ordonnances liées à ce dossier ({prescriptions.length})</h3>
            
            {prescriptions.map(prescription => (
              <div key={prescription.id} className="prescription-card linked">
                <div className="prescription-header">
                  <h4>Ordonnance du {formatDate(prescription.date)}</h4>
                  <div className="prescription-link-indicator">
                    <i className="fas fa-link"></i>
                    <span>Liée à ce dossier médical</span>
                  </div>
                </div>
                
                <div className="prescription-body">
                  <h5>Médicaments prescrits ({prescription.medications?.length || 0}):</h5>
                  {prescription.medications && prescription.medications.length > 0 ? (
                    <ul className="medications-list">
                      {prescription.medications.map((med, index) => (
                        <li key={index} className="medication-item">
                          <div className="medication-name">
                            <i className="fas fa-pills"></i>
                            <span>{med.name}</span>
                          </div>
                          <div className="medication-details">
                            <span className="detail">
                              <strong>Dosage:</strong> {med.dosage}
                            </span>
                            <span className="detail">
                              <strong>Fréquence:</strong> {med.frequency}
                            </span>
                            <span className="detail">
                              <strong>Durée:</strong> {med.duration}
                            </span>
                            {med.instructions && (
                              <span className="detail full-width">
                                <strong>Instructions:</strong> {med.instructions}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-medications">Aucun médicament renseigné</p>
                  )}
                  
                  {prescription.notes && (
                    <div className="prescription-notes">
                      <p><strong>Notes:</strong> {prescription.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="prescription-footer">
                  <button 
                    className="btn-outline"
                    onClick={() => onViewPatient(medicalRecord.patient_id)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-user"></i> Voir patient
                  </button>
                  <button 
                    className="btn-outline"
                    onClick={() => window.print()}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-print"></i> Imprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-prescription-bottle"></i>
            <h3>Aucune ordonnance trouvée</h3>
            <p>Aucune ordonnance n'est encore liée à ce dossier médical</p>
            <button 
              className="btn-primary"
              onClick={() => onCreatePrescription(medicalRecord)}
              disabled={actionLoading}
            >
              <i className="fas fa-plus"></i> Créer la première ordonnance
            </button>
          </div>
        )}
      </div>

      {/* Actions globales */}
      <div className="global-actions">
        <button 
          className="btn-outline"
          onClick={() => onViewPatient(medicalRecord.patient_id)}
          disabled={actionLoading}
        >
          <i className="fas fa-user"></i> Voir le profil complet du patient
        </button>
        <button 
          className="btn-primary"
          onClick={() => onCreatePrescription(medicalRecord)}
          disabled={actionLoading}
        >
          <i className="fas fa-plus"></i> Ajouter une nouvelle ordonnance
        </button>
      </div>
    </div>
  );
};

export default MedicalRecordPrescriptions;