// src/components/patient-dashboard/Prescriptions.jsx
import React from "react";

const Prescriptions = ({ prescriptions, actionLoading }) => (
  <div className="prescriptions-container">
    <h3>Mes ordonnances</h3>
    {prescriptions.length > 0 ? (
      <div className="prescriptions-list">
        {prescriptions.map(prescription => (
          <div key={prescription.id} className="prescription-card">
            <div className="prescription-header">
              <h4>Ordonnance du {prescription.date}</h4>
              <span className="prescription-doctor">{prescription.doctor}</span>
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
            </div>
            <div className="prescription-footer">
              <button className="btn-outline" 
                onClick={() => alert("Fonctionnalité en cours de développement")}
                disabled={actionLoading}>
                <i className="fas fa-download"></i> Télécharger
              </button>
              <button className="btn-outline" onClick={() => window.print()} disabled={actionLoading}>
                <i className="fas fa-print"></i> Imprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <i className="fas fa-prescription-bottle"></i>
        <h3>Aucune ordonnance</h3>
        <p>Vos ordonnances apparaîtront ici après votre consultation</p>
      </div>
    )}
  </div>
);

export default Prescriptions;