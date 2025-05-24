// src/components/doctor-dashboard/MedicalRecordForm.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import axios from "../../axios";

const MedicalRecordForm = ({
  patient,
  appointment,
  handleCreateMedicalRecord,
  handleCancel,
  actionLoading,
}) => {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    date: today,
    type: appointment ? "consultation" : "consultation",
    appointment_id: appointment ? appointment.id.toString() : "", // Pré-remplir si rendez-vous fourni
    diagnosis: "",
    notes: "",
    documents: [],
  });

  // États pour la gestion des rendez-vous
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);

  // État pour la gestion des fichiers
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les rendez-vous du patient avec ce médecin
  useEffect(() => {
    const fetchPatientAppointments = async () => {
      if (!patient?.id) return;

      try {
        setLoadingAppointments(true);
        const response = await axios.get(`/api/doctor/patients/${patient.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        // Récupérer les rendez-vous du patient
        const patientAppointments = response.data.patient.appointments || [];

        // Filtrer les rendez-vous confirmés qui n'ont pas encore de dossier médical
        const availableAppointments = patientAppointments.filter(
          (apt) => apt.status === "confirmé" && !apt.has_medical_record
        );

        setAppointments(availableAppointments);
      } catch (err) {
        console.error("Erreur lors du chargement des rendez-vous:", err);
        setAppointmentsError(
          "Impossible de charger les rendez-vous du patient."
        );
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchPatientAppointments();
  }, [patient?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    let newErrors = {};

    // Validation des fichiers
    const validFiles = files.filter((file) => {
      // Taille maximale (10 Mo)
      const maxSize = 10 * 1024 * 1024;

      if (file.size > maxSize) {
        newErrors[
          file.name
        ] = `Le fichier ${file.name} dépasse la taille maximale de 10 Mo.`;
        return false;
      }

      // Vérifier les types de fichiers autorisés
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        newErrors[
          file.name
        ] = `Le type de fichier ${file.type} n'est pas autorisé.`;
        return false;
      }

      return true;
    });

    // Mise à jour des erreurs
    if (Object.keys(newErrors).length > 0) {
      setFileErrors(newErrors);
      setTimeout(() => {
        setFileErrors({});
      }, 5000);
    }

    // Ajout des fichiers valides
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    // Supprimer également le progress
    const newProgress = { ...uploadProgress };
    delete newProgress[index];
    setUploadProgress(newProgress);
  };

  // Simulation de l'upload des fichiers
  const simulateFileUpload = (file, index) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;

        if (progress >= 100) {
          clearInterval(interval);
          progress = 100;
          setTimeout(() => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
            });
          }, 500);
        }

        setUploadProgress((prev) => ({
          ...prev,
          [index]: progress,
        }));
      }, 200);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Simuler l'upload de tous les fichiers
      const uploadPromises = selectedFiles.map((file, index) =>
        simulateFileUpload(file, index)
      );

      // Attendre que tous les uploads soient terminés
      const uploadedFiles = await Promise.all(uploadPromises);

      // CORRECTION : Préparation correcte des données
      const recordData = {
        ...formData,
        // Convertir appointment_id correctement
        appointment_id:
          formData.appointment_id && formData.appointment_id !== ""
            ? parseInt(formData.appointment_id)
            : null,
        documents: uploadedFiles,
      };

      // CORRECTION : Debug des données avant envoi
      console.log("Données à envoyer au backend:", recordData);
      console.log("appointment_id type:", typeof recordData.appointment_id);
      console.log("appointment_id value:", recordData.appointment_id);

      // Envoi des données au backend
      handleCreateMedicalRecord(recordData);
    } catch (error) {
      console.error("Erreur lors de l'upload des fichiers:", error);
      setIsSubmitting(false);
    }
  };

  // Fonction utilitaire pour déterminer l'icône en fonction du type de fichier
  const getFileIcon = (type) => {
    if (!type) return "fa-file";

    type = type.toLowerCase();

    if (type.includes("pdf")) {
      return "fa-file-pdf";
    } else if (type.includes("image")) {
      return "fa-file-image";
    } else if (type.includes("word") || type.includes("doc")) {
      return "fa-file-word";
    } else if (type.includes("excel") || type.includes("sheet")) {
      return "fa-file-excel";
    } else if (type.includes("text") || type.includes("txt")) {
      return "fa-file-alt";
    } else {
      return "fa-file";
    }
  };

  return (
    <div className="medical-record-container">
      <div className="form-content">
        <div className="form-header">
          <div className="patient-info">
            <h3>Créer un dossier médical</h3>
            <div className="patient-details">
              <span className="patient-name">
                Patient: <strong>{patient.name}</strong>
              </span>
              {appointment && (
                <span className="appointment-details">
                  Rendez-vous du <strong>{appointment.date}</strong> à{" "}
                  <strong>{appointment.time}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="medical-record-form">
          <div className="form-grid">
            <div className="form-main">
              <div className="form-section">
                <h4>Informations générales</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date de consultation</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      disabled={actionLoading || isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Type de consultation</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={actionLoading || isSubmitting}
                    >
                      <option value="consultation">Consultation normale</option>
                      <option value="analyse">Analyse/Examen</option>
                      <option value="chirurgie">
                        Intervention chirurgicale
                      </option>
                      <option value="suivi">Consultation de suivi</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                {/* NOUVEAU : Champ pour sélectionner le rendez-vous (optionnel) */}
                <div className="form-group">
                  <label htmlFor="appointment_id">
                    Rendez-vous associé{" "}
                    <span className="optional-label">(optionnel)</span>
                  </label>
                  {loadingAppointments ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i> Chargement des
                      rendez-vous...
                    </div>
                  ) : appointmentsError ? (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>{" "}
                      {appointmentsError}
                    </div>
                  ) : (
                    <select
                      id="appointment_id"
                      name="appointment_id"
                      value={formData.appointment_id}
                      onChange={handleChange}
                      disabled={actionLoading || isSubmitting}
                    >
                      <option value="">-- Aucun rendez-vous associé --</option>
                      {appointments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.date} à {apt.time} -{" "}
                          {apt.reason || "Consultation"}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className="form-help">
                    Vous pouvez associer ce dossier médical à un rendez-vous
                    spécifique ou le laisser indépendant.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="diagnosis">Diagnostic</label>
                  <input
                    type="text"
                    id="diagnosis"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    placeholder="Diagnostic principal"
                    required
                    disabled={actionLoading || isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes et observations</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Observations, symptômes, traitements recommandés..."
                    rows="5"
                    disabled={actionLoading || isSubmitting}
                  ></textarea>
                </div>
              </div>

              <div className="form-section">
                <h4>Documents associés</h4>

                <div className="form-group">
                  <label htmlFor="documents">
                    Ajouter des documents (résultats d'analyse, images, etc.)
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="documents"
                      onChange={handleFileChange}
                      multiple
                      className="file-input"
                      disabled={actionLoading || isSubmitting}
                    />
                    <label htmlFor="documents" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i> Choisir des
                      fichiers
                    </label>
                    <span className="file-info-text">
                      Max: 10 Mo. Formats: PDF, Images, DOC, XLS, TXT
                    </span>
                  </div>

                  {/* Affichage des erreurs de fichiers */}
                  {Object.keys(fileErrors).length > 0 && (
                    <div className="file-errors">
                      {Object.values(fileErrors).map((error, index) => (
                        <div key={index} className="file-error-message">
                          <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Liste des fichiers sélectionnés */}
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      <p className="files-header">Fichiers sélectionnés:</p>
                      <ul className="files-list">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="file-item">
                            <div className="file-info">
                              <i
                                className={`fas ${getFileIcon(file.type)}`}
                              ></i>
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>

                            {/* Barre de progression pour l'upload */}
                            {uploadProgress[index] !== undefined && (
                              <div className="file-progress">
                                <div
                                  className="progress-bar"
                                  style={{ width: `${uploadProgress[index]}%` }}
                                ></div>
                                <span className="progress-text">
                                  {uploadProgress[index]}%
                                </span>
                              </div>
                            )}

                            {/* Bouton de suppression */}
                            {!actionLoading && !isSubmitting && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => removeFile(index)}
                                disabled={actionLoading || isSubmitting}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-sidebar">
              <div className="info-panel">
                <h4>Informations patient</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Groupe sanguin:</span>
                    <span className="info-value">
                      {patient.blood_type || "Non renseigné"}
                    </span>
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
                      {patient.chronic_diseases &&
                      patient.chronic_diseases.length > 0
                        ? patient.chronic_diseases.join(", ")
                        : "Aucune maladie chronique connue"}
                    </span>
                  </div>
                </div>

                <h4>Antécédents médicaux</h4>
                <div className="medical-history">
                  {patient.medical_history ||
                    "Aucun antécédent médical renseigné"}
                </div>

                {/* Affichage des informations du rendez-vous sélectionné */}
                {formData.appointment_id && appointments.length > 0 && (
                  <div className="selected-appointment-info">
                    <h4>Rendez-vous sélectionné</h4>
                    {(() => {
                      const selectedAppointment = appointments.find(
                        (apt) => apt.id.toString() === formData.appointment_id
                      );
                      return selectedAppointment ? (
                        <div className="appointment-summary">
                          <p>
                            <strong>Date:</strong> {selectedAppointment.date}
                          </p>
                          <p>
                            <strong>Heure:</strong> {selectedAppointment.time}
                          </p>
                          <p>
                            <strong>Motif:</strong>{" "}
                            {selectedAppointment.reason || "Non spécifié"}
                          </p>
                          {selectedAppointment.notes && (
                            <p>
                              <strong>Notes:</strong>{" "}
                              {selectedAppointment.notes}
                            </p>
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
              disabled={actionLoading || isSubmitting}
            >
              {actionLoading || isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Création en
                  cours...
                </>
              ) : (
                "Créer le dossier médical"
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={actionLoading || isSubmitting}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordForm;
