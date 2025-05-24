// src/components/doctor-dashboard/PatientDetails.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const PatientDetails = ({ patient, handleSubTabChange, actionLoading }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);

  // États pour la gestion des actions
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  
  // États pour les modales et vues détaillées
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState([]);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);

  // Utilisation des données réelles récupérées de l'API
  const medicalRecords = patient.medical_records || [];
  const prescriptions = patient.prescriptions || [];
  const appointments = patient.appointments || [];

  // Charger les factures du patient quand l'onglet factures est activé ou quand le patient change
  useEffect(() => {
    if (activeTab === "invoices" && patient && patient.id) {
      fetchPatientInvoices();
    }
  }, [activeTab, patient?.id]);

  // Fonction pour récupérer les factures du patient
  const fetchPatientInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setInvoiceError(null);

      const response = await axios.get(
        `/api/doctor/patients/${patient.id}/invoices`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setInvoices(response.data.invoices || []);
      setLoadingInvoices(false);
    } catch (err) {
      console.error("Erreur lors du chargement des factures:", err);
      setInvoiceError(
        "Impossible de charger les factures. Veuillez réessayer plus tard."
      );
      setLoadingInvoices(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Format pour la monnaie
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Fonction pour télécharger un document - version corrigée
  const handleDownloadDocument = async (docId) => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      const response = await axios.get(
        `/api/doctor/documents/${docId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      // Extraction du nom du fichier depuis l'en-tête de la réponse
      const contentDisposition = response.headers["content-disposition"];
      let filename = "document.pdf";

      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      // Création d'un objet URL pour le fichier téléchargé
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Création d'un lien temporaire pour déclencher le téléchargement
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setDownloadSuccess(`Document "${filename}" téléchargé avec succès`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      setDownloadError(
        "Impossible de télécharger le document. Veuillez réessayer plus tard."
      );
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  // NOUVELLES FONCTIONS pour gérer les actions des rendez-vous
  
  // Fonction pour voir un dossier médical
  const handleViewMedicalRecord = (medicalRecord) => {
    setSelectedMedicalRecord(medicalRecord);
    setShowMedicalRecordModal(true);
  };

  // Fonction pour voir les ordonnances
  const handleViewPrescriptions = (prescriptions) => {
    setSelectedPrescriptions(prescriptions);
    setShowPrescriptionsModal(true);
  };

  // Fonction pour créer un dossier médical à partir d'un rendez-vous
  const handleCreateMedicalRecordForAppointment = (appointment) => {
    // Passer à l'onglet de création de dossier médical avec le rendez-vous pré-sélectionné
    handleSubTabChange("record", appointment);
  };

  // Fonction pour fermer les modales
  const closeMedicalRecordModal = () => {
    setShowMedicalRecordModal(false);
    setSelectedMedicalRecord(null);
  };

  const closePrescriptionsModal = () => {
    setShowPrescriptionsModal(false);
    setSelectedPrescriptions([]);
  };

  return (
    <div className="patient-details-container">
      <div className="patient-header">
        <div className="patient-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="patient-title">
          <h2>{patient.name}</h2>
          <p>{patient.email}</p>
        </div>
        <div className="patient-actions">
          <button
            className="btn-outline"
            onClick={() => handleSubTabChange("record")}
            disabled={actionLoading || isDownloading}
          >
            <i className="fas fa-file-medical"></i> Nouvelle consultation
          </button>
          <button
            className="btn-outline"
            onClick={() => handleSubTabChange("prescription")}
            disabled={actionLoading || isDownloading}
          >
            <i className="fas fa-prescription"></i> Nouvelle ordonnance
          </button>
        </div>
      </div>

      {/* Messages de statut pour le téléchargement */}
      {downloadSuccess && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {downloadSuccess}
        </div>
      )}

      {downloadError && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {downloadError}
        </div>
      )}

      <div className="patient-tabs">
        <button
          className={`patient-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => handleTabChange("info")}
        >
          <i className="fas fa-info-circle"></i> Informations
        </button>
        <button
          className={`patient-tab ${activeTab === "records" ? "active" : ""}`}
          onClick={() => handleTabChange("records")}
        >
          <i className="fas fa-file-medical"></i> Dossier médical
        </button>
        <button
          className={`patient-tab ${
            activeTab === "prescriptions" ? "active" : ""
          }`}
          onClick={() => handleTabChange("prescriptions")}
        >
          <i className="fas fa-prescription"></i> Ordonnances
        </button>
        <button
          className={`patient-tab ${
            activeTab === "appointments" ? "active" : ""
          }`}
          onClick={() => handleTabChange("appointments")}
        >
          <i className="fas fa-calendar-alt"></i> Rendez-vous
        </button>
        <button
          className={`patient-tab ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => handleTabChange("invoices")}
        >
          <i className="fas fa-file-invoice-dollar"></i> Factures
        </button>
      </div>

      <div className="patient-content">
        {activeTab === "info" && (
          <div className="patient-info-tab">
            <div className="patient-info-container">
              <h3 className="section-title">Informations personnelles</h3>

              <div className="info-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom complet</label>
                    <div className="info-value">{patient.name}</div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <div className="info-value">{patient.email}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone</label>
                    <div className="info-value">
                      {patient.phone || "Non renseigné"}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Date de naissance</label>
                    <div className="info-value">
                      {patient.date_of_birth || "Non renseignée"}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Adresse</label>
                    <div className="info-value">
                      {patient.address || "Non renseignée"}
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="section-title">Informations médicales</h3>

              <div className="info-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Groupe sanguin</label>
                    <div className="info-value">
                      {patient.blood_type || "Non renseigné"}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Allergies</label>
                    <div className="info-value">
                      {patient.allergies && patient.allergies.length > 0
                        ? patient.allergies.join(", ")
                        : "Aucune allergie renseignée"}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Maladies chroniques</label>
                    <div className="info-value">
                      {patient.chronic_diseases &&
                      patient.chronic_diseases.length > 0
                        ? patient.chronic_diseases.join(", ")
                        : "Aucune maladie chronique renseignée"}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contact d'urgence</label>
                    <div className="info-value">
                      {patient.emergency_contact || "Non renseigné"}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Antécédents médicaux</label>
                    <div className="info-value medical-history">
                      {patient.medical_history ||
                        "Aucun antécédent médical renseigné"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "records" && (
          <div className="patient-records-tab">
            <h3>Dossier médical</h3>
            {medicalRecords.length > 0 ? (
              <div className="records-timeline">
                {medicalRecords.map((record) => (
                  <div key={record.id} className="record-item">
                    <div className="record-date">
                      <span className="date">{record.date}</span>
                      <span className="type">{record.type}</span>
                    </div>
                    <div className="record-content">
                      <h4>Consultation avec Dr. {record.doctor_name}</h4>
                      <div className="record-details">
                        <p>
                          <strong>Diagnostic:</strong> {record.diagnosis}
                        </p>
                        <p>
                          <strong>Notes:</strong> {record.notes}
                        </p>
                        {record.documents && record.documents.length > 0 && (
                          <div className="record-documents">
                            <p>
                              <strong>Documents:</strong>
                            </p>
                            <ul>
                              {record.documents.map((doc, index) => (
                                <li key={index}>
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDownloadDocument(doc.id);
                                    }}
                                  >
                                    <i className="fas fa-file-download"></i>{" "}
                                    {doc.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-folder-open"></i>
                <h4>Aucun dossier médical</h4>
                <p>Ce patient n'a pas encore de dossier médical</p>
                <button
                  className="btn-primary"
                  onClick={() => handleSubTabChange("record")}
                  disabled={actionLoading || isDownloading}
                >
                  Créer un dossier médical
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="patient-prescriptions-tab">
            <h3>Ordonnances</h3>
            {prescriptions.length > 0 ? (
              <div className="prescriptions-list">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="prescription-card">
                    <div className="prescription-header">
                      <h4>Ordonnance du {prescription.date}</h4>
                      <span className="prescription-doctor">
                        Dr. {prescription.doctor_name}
                      </span>
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
                                  <strong>Instructions:</strong>{" "}
                                  {med.instructions}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {prescription.notes && (
                        <div className="prescription-notes">
                          <p>
                            <strong>Notes:</strong> {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="prescription-footer">
                      <button
                        className="btn-outline"
                        onClick={() => window.print()}
                        disabled={actionLoading || isDownloading}
                      >
                        <i className="fas fa-print"></i> Imprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-prescription-bottle"></i>
                <h4>Aucune ordonnance</h4>
                <p>Ce patient n'a pas encore d'ordonnance</p>
                <button
                  className="btn-primary"
                  onClick={() => handleSubTabChange("prescription")}
                  disabled={actionLoading || isDownloading}
                >
                  Créer une ordonnance
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="patient-appointments-tab">
            <h3>Historique des rendez-vous</h3>
            {appointments.length > 0 ? (
              <div className="appointments-timeline">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-date-info">
                        <h4>{new Date(appointment.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</h4>
                        <span className="appointment-time">{appointment.time}</span>
                        <span className={`status-badge ${appointment.status.replace(" ", "")}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="appointment-body">
                      <div className="appointment-details">
                        <p><strong>Motif:</strong> {appointment.reason || "Non spécifié"}</p>
                        {appointment.notes && (
                          <p><strong>Notes:</strong> {appointment.notes}</p>
                        )}
                      </div>
                      
                      {/* Section des documents associés */}
                      <div className="appointment-related-docs">
                        <h5>Documents associés à ce rendez-vous</h5>
                        
                        {/* Dossier médical associé */}
                        {appointment.medical_record && (
                          <div className="related-document medical-record">
                            <div className="doc-icon">
                              <i className="fas fa-file-medical"></i>
                            </div>
                            <div className="doc-info">
                              <h6>Dossier médical</h6>
                              <p>Diagnostic: {appointment.medical_record.diagnosis}</p>
                              <p>Type: {appointment.medical_record.type}</p>
                            </div>
                            <div className="doc-actions">
                              <button 
                                className="btn-sm btn-outline"
                                onClick={() => handleViewMedicalRecord(appointment.medical_record)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-eye"></i> Consulter
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Ordonnances associées */}
                        {appointment.prescriptions && appointment.prescriptions.length > 0 && (
                          <div className="related-document prescriptions">
                            <div className="doc-icon">
                              <i className="fas fa-prescription"></i>
                            </div>
                            <div className="doc-info">
                              <h6>Ordonnances ({appointment.prescriptions.length})</h6>
                              <p>Médicaments prescrits lors de cette consultation</p>
                            </div>
                            <div className="doc-actions">
                              <button 
                                className="btn-sm btn-outline"
                                onClick={() => handleViewPrescriptions(appointment.prescriptions)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-pills"></i> Voir ordonnances
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* État si aucun document */}
                        {!appointment.medical_record && (!appointment.prescriptions || appointment.prescriptions.length === 0) && (
                          <div className="no-related-docs">
                            <i className="fas fa-info-circle"></i>
                            <p>Aucun document médical associé à ce rendez-vous</p>
                            {appointment.status === "confirmé" && (
                              <div className="quick-actions">
                                <button 
                                  className="btn-sm btn-primary"
                                  onClick={() => handleCreateMedicalRecordForAppointment(appointment)}
                                  disabled={actionLoading}
                                >
                                  <i className="fas fa-plus"></i> Créer dossier médical
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-calendar-times"></i>
                <h4>Aucun rendez-vous</h4>
                <p>Ce patient n'a pas encore pris de rendez-vous</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet des factures */}
        {activeTab === "invoices" && (
          <div className="patient-invoices-tab">
            <h3>Factures du patient</h3>
            {loadingInvoices ? (
              <div className="loading-state small">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Chargement des factures...</p>
              </div>
            ) : invoiceError ? (
              <div className="error-state small">
                <i className="fas fa-exclamation-circle"></i>
                <h4>Erreur</h4>
                <p>{invoiceError}</p>
              </div>
            ) : invoices.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Date</th>
                    <th>Échéance</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.number}</td>
                      <td>{invoice.date}</td>
                      <td>{invoice.due_date}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status === "paid"
                            ? "Payée"
                            : invoice.status === "overdue"
                            ? "En retard"
                            : "Non payée"}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-icon"
                          title="Imprimer la facture"
                          onClick={() => window.print()}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-print"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state small">
                <i className="fas fa-file-invoice-dollar"></i>
                <h4>Aucune facture</h4>
                <p>Ce patient n'a pas encore de factures</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale pour afficher les détails d'un dossier médical */}
      {showMedicalRecordModal && selectedMedicalRecord && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Détails du dossier médical</h3>
              <button className="btn-icon" onClick={closeMedicalRecordModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="medical-record-details">
                <div className="detail-row">
                  <strong>Type:</strong> {selectedMedicalRecord.type}
                </div>
                <div className="detail-row">
                  <strong>Diagnostic:</strong> {selectedMedicalRecord.diagnosis}
                </div>
                <div className="detail-row">
                  <strong>Notes:</strong> {selectedMedicalRecord.notes || "Aucune note"}
                </div>
                {selectedMedicalRecord.documents && selectedMedicalRecord.documents.length > 0 && (
                  <div className="detail-row">
                    <strong>Documents:</strong>
                    <ul>
                      {selectedMedicalRecord.documents.map((doc, index) => (
                        <li key={index}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadDocument(doc.id);
                            }}
                          >
                            <i className="fas fa-file-download"></i> {doc.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeMedicalRecordModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale pour afficher les ordonnances */}
      {showPrescriptionsModal && selectedPrescriptions.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Ordonnances associées</h3>
              <button className="btn-icon" onClick={closePrescriptionsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="prescriptions-details">
                {selectedPrescriptions.map((prescription, index) => (
                  <div key={index} className="prescription-detail">
                    <h4>Ordonnance du {prescription.date}</h4>
                    <div className="medications-list">
                      {prescription.medications.map((med, medIndex) => (
                        <div key={medIndex} className="medication-detail">
                          <strong>{med.name}</strong> - {med.dosage}, {med.frequency}, {med.duration}
                          {med.instructions && <p><em>Instructions: {med.instructions}</em></p>}
                        </div>
                      ))}
                    </div>
                    {prescription.notes && (
                      <div className="prescription-notes">
                        <strong>Notes:</strong> {prescription.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closePrescriptionsModal}>
                Fermer
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <i className="fas fa-print"></i> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;