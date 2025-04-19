// src/components/patient-dashboard/MedicalRecords.jsx
import React from "react";

const MedicalRecords = ({ medicalRecords, handleDownloadDocument, actionLoading }) => (
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
            {medicalRecords.map(record => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.type}</td>
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
                  <button className="btn-icon" title="Voir les détails" disabled={actionLoading}>
                    <i className="fas fa-eye"></i>
                  </button>
                  {record.documents && record.documents.length > 0 && (
                    <button className="btn-icon" title="Télécharger documents"
                      onClick={() => handleDownloadDocument(record.documents[0].id)}
                      disabled={actionLoading}>
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
          <p>Votre historique médical apparaîtra ici après votre première consultation</p>
        </div>
      )}
    </div>
  </div>
);

export default MedicalRecords;