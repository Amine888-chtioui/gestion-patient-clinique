// src/components/patient-dashboard/Prescriptions.jsx - Version optimisée
import React, { useState, useCallback } from "react";
import apiClient from "../../services/apiClient";

const Prescriptions = ({ prescriptions, actionLoading }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Fonction pour gérer les fichiers PDF (téléchargement et impression)
  const handlePdfAction = useCallback(async (prescriptionId, action = "download") => {
    setDownloadingPdf(prescriptionId);

    try {
      const response = await apiClient.downloadPrescriptionPdf(prescriptionId);

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      if (action === "print") {
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (action === "view") {
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        // Téléchargement
        const link = document.createElement("a");
        link.href = url;

        let filename = `ordonnance_${prescriptionId}.pdf`;
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) filename = filenameMatch[1];
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erreur lors du traitement du PDF:", err);

      const errorMessages = {
        404: "Cette ordonnance n'existe pas ou n'est pas accessible.",
        403: "Vous n'avez pas l'autorisation d'accéder à cette ordonnance.",
        500: "Erreur du serveur lors de la génération du PDF. Veuillez réessayer plus tard.",
      };

      alert(
        errorMessages[err.response?.status] ||
        "Erreur lors du traitement de l'ordonnance."
      );
    } finally {
      setDownloadingPdf(null);
    }
  }, []);

  if (prescriptions.length === 0) {
    return (
      <div className="prescriptions-container">
        <h3>Mes ordonnances</h3>
        <div className="empty-state">
          <i className="fas fa-prescription-bottle"></i>
          <h3>Aucune ordonnance</h3>
          <p>Vos ordonnances apparaîtront ici après votre consultation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-container">
      <h3>Mes ordonnances</h3>
      <div className="prescriptions-list">
        {prescriptions.map((prescription) => (
          <PrescriptionCard
            key={prescription.id}
            prescription={prescription}
            onPdfAction={handlePdfAction}
            isDownloading={downloadingPdf === prescription.id}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  );
};

// Composant pour une carte d'ordonnance individuelle
const PrescriptionCard = React.memo(({
  prescription,
  onPdfAction,
  isDownloading,
  actionLoading,
}) => (
  <div className="prescription-card">
    <div className="prescription-header">
      <h4>Ordonnance du {prescription.date}</h4>
      <span className="prescription-doctor">{prescription.doctor}</span>
    </div>

    <div className="prescription-body">
      <h5>Médicaments prescrits:</h5>
      <ul className="medications-list">
        {prescription.medications.map((med, index) => (
          <MedicationItem key={index} medication={med} />
        ))}
      </ul>
    </div>

    <div className="prescription-footer">
      <button
        className="btn-outline"
        onClick={() => onPdfAction(prescription.id, "download")}
        disabled={actionLoading || isDownloading}
        title="Télécharger l'ordonnance en PDF"
      >
        {isDownloading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> Génération...
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf"></i> PDF
          </>
        )}
      </button>

      <button
        className="btn-outline"
        onClick={() => onPdfAction(prescription.id, "print")}
        disabled={actionLoading || isDownloading}
        title="Imprimer l'ordonnance"
      >
        <i className="fas fa-print"></i> Imprimer
      </button>

      <button
        className="btn-outline"
        onClick={() => onPdfAction(prescription.id, "view")}
        disabled={actionLoading}
        title="Visualiser l'ordonnance"
      >
        <i className="fas fa-eye"></i> Voir
      </button>
    </div>
  </div>
));

// Composant pour un médicament individuel
const MedicationItem = React.memo(({ medication }) => (
  <li className="medication-item">
    <div className="medication-name">
      <i className="fas fa-pills"></i>
      <span>{medication.name}</span>
    </div>
    <div className="medication-details">
      <span className="detail">
        <strong>Dosage:</strong> {medication.dosage}
      </span>
      <span className="detail">
        <strong>Fréquence:</strong> {medication.frequency}
      </span>
      <span className="detail">
        <strong>Durée:</strong> {medication.duration}
      </span>
      {medication.instructions && (
        <span className="detail full-width">
          <strong>Instructions:</strong> {medication.instructions}
        </span>
      )}
    </div>
  </li>
));

export default Prescriptions;