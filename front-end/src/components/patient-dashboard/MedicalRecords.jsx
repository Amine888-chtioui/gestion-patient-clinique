// src/components/patient-dashboard/MedicalRecords.jsx
import React, { useState } from "react";
import Modal from "../common/Modal";
// Import CSS directly in this component
import "../common/modal.css";

const MedicalRecords = ({
  medicalRecords,
  handleDownloadDocument,
  actionLoading,
}) => {
  // New state for detailed view
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fonction pour afficher les détails d'un dossier médical
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Fermer le modal de détails
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  // Formatter la date pour un affichage plus lisible
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Obtenir un label pour le type de dossier médical
  const getTypeLabel = (type) => {
    const types = {
      consultation: "Consultation",
      analyse: "Analyse",
      chirurgie: "Chirurgie",
      suivi: "Suivi",
      autre: "Autre",
    };
    return types[type] || type;
  };

  return (
    <div className="medical-records-container">
      <div className="records-list">
        <h3>Historique médical</h3>
        {medicalRecords.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Médecin</th>
                <th>Diagnostic</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicalRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{getTypeLabel(record.type)}</td>
                  <td>{record.doctor}</td>
                  <td>{record.diagnosis || "Non spécifié"}</td>
                  <td>
                    {record.documents && record.documents.length > 0 ? (
                      record.documents.map((doc, index) => (
                        <span key={index} className="document-badge">
                          {doc.type || doc.name}
                        </span>
                      ))
                    ) : (
                      <span>Aucun document</span>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      title="Voir les détails"
                      onClick={() => handleViewDetails(record)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {record.documents && record.documents.length > 0 && (
                      <button
                        className="btn-icon"
                        title="Télécharger documents"
                        onClick={() =>
                          handleDownloadDocument(record.documents[0].id)
                        }
                        disabled={actionLoading}
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <h3>Aucun dossier médical</h3>
            <p>
              Votre historique médical apparaîtra ici après votre première
              consultation
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails du dossier médical */}
      {isDetailModalOpen && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          title="Détails du dossier médical"
          size="large"
        >
          {selectedRecord && (
            <>
              <div className="detail-section">
                <h4>Informations générales</h4>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {formatDate(selectedRecord.date)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">
                    {getTypeLabel(selectedRecord.type)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Médecin:</span>
                  <span className="detail-value">{selectedRecord.doctor}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Diagnostic</h4>
                <p>{selectedRecord.diagnosis || "Aucun diagnostic spécifié"}</p>
              </div>

              {/* Si des notes sont disponibles, les afficher */}
              {selectedRecord.notes && (
                <div className="detail-section">
                  <h4>Notes du médecin</h4>
                  <p>{selectedRecord.notes}</p>
                </div>
              )}

              {/* Si des documents sont disponibles, les afficher */}
              {selectedRecord.documents &&
                selectedRecord.documents.length > 0 && (
                  <div className="detail-section">
                    <h4>Documents</h4>
                    <div className="documents-list">
                      {selectedRecord.documents.map((doc, index) => (
                        <div key={index} className="document-item">
                          <div className="document-info">
                            <i className="fas fa-file-medical"></i>
                            <span>{doc.name || doc.type}</span>
                          </div>
                          <button
                            className="btn-sm btn-outline"
                            onClick={() => handleDownloadDocument(doc.id)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-download"></i> Télécharger
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="detail-actions">
                <button className="btn-primary" onClick={closeDetailModal}>
                  Fermer
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Styles additionnels pour les documents */}
      <style jsx>{`
        .documents-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: var(--bg-color);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .document-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .document-info i {
          color: var(--primary-color);
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
};

export default MedicalRecords;
