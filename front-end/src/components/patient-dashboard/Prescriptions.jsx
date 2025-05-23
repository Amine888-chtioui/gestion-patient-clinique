// src/components/patient-dashboard/Prescriptions.jsx - Version mise à jour
import React, { useState } from "react";
import axios from "../../axios";

const Prescriptions = ({ prescriptions, actionLoading }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Fonction pour télécharger l'ordonnance en PDF
  const handleDownloadPrescriptionPdf = async (prescriptionId) => {
    setDownloadingPdf(prescriptionId);

    try {
      const response = await axios.get(
        `/api/patient/prescriptions/${prescriptionId}/download-pdf`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          responseType: 'blob', // Important pour recevoir le fichier PDF
        }
      );

      // Créer une URL pour le blob PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a');
      link.href = url;
      
      // Extraire le nom de fichier depuis les en-têtes de réponse ou utiliser un nom par défaut
      let filename = `ordonnance_${prescriptionId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      
      // Ajouter temporairement le lien au DOM et cliquer dessus
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF:", err);
      
      let errorMessage = "Erreur lors du téléchargement de l'ordonnance.";
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Cette ordonnance n'existe pas ou n'est pas accessible.";
        } else if (err.response.status === 403) {
          errorMessage = "Vous n'avez pas l'autorisation d'accéder à cette ordonnance.";
        } else if (err.response.status === 500) {
          errorMessage = "Erreur du serveur lors de la génération du PDF. Veuillez réessayer plus tard.";
        }
      }
      
      alert(errorMessage);
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Fonction pour imprimer l'ordonnance (nouvelle fonctionnalité)
  const handlePrintPrescription = async (prescriptionId) => {
    try {
      const response = await axios.get(
        `/api/patient/prescriptions/${prescriptionId}/download-pdf`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          responseType: 'blob',
        }
      );

      // Créer une URL pour le blob PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Ouvrir le PDF dans une nouvelle fenêtre pour impression
      const printWindow = window.open(url, '_blank');
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (err) {
      console.error("Erreur lors de l'ouverture pour impression:", err);
      alert("Erreur lors de l'ouverture de l'ordonnance pour impression.");
    }
  };

  return (
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
              </div>
              
              <div className="prescription-footer">
                {/* Bouton de téléchargement PDF mis à jour */}
                <button 
                  className="btn-outline" 
                  onClick={() => handleDownloadPrescriptionPdf(prescription.id)}
                  disabled={actionLoading || downloadingPdf === prescription.id}
                  title="Télécharger l'ordonnance en PDF"
                >
                  {downloadingPdf === prescription.id ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Génération...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-pdf"></i> PDF
                    </>
                  )}
                </button>
                
                {/* Bouton d'impression */}
                <button 
                  className="btn-outline" 
                  onClick={() => handlePrintPrescription(prescription.id)}
                  disabled={actionLoading || downloadingPdf === prescription.id}
                  title="Imprimer l'ordonnance"
                >
                  <i className="fas fa-print"></i> Imprimer
                </button>
                
                {/* Bouton de visualisation (optionnel) */}
                <button 
                  className="btn-outline" 
                  onClick={() => window.open(`/api/patient/prescriptions/${prescription.id}/download-pdf`, '_blank')}
                  disabled={actionLoading}
                  title="Visualiser l'ordonnance"
                >
                  <i className="fas fa-eye"></i> Voir
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
};

export default Prescriptions;