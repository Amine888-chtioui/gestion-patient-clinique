// src/components/doctor-dashboard/DoctorMedicalRecords.jsx
// Mise à jour du code pour corriger la navigation vers les détails du patient

import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";
import DocumentViewer from "./DocumentViewer";

const DoctorMedicalRecords = ({ 
  patients, 
  handlePatientSelect, 
  handleSubTabChange, 
  actionLoading 
}) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  // États pour la gestion des documents
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentActionLoading, setDocumentActionLoading] = useState(false);
  const [documentActionError, setDocumentActionError] = useState(null);
  const [documentActionSuccess, setDocumentActionSuccess] = useState(null);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/doctor/medical-records", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMedicalRecords(response.data.medicalRecords || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching medical records:", err);
      setError("Impossible de charger les dossiers médicaux. Veuillez réessayer plus tard.");
      setLoading(false);
    }
  };

  // Filtrer les dossiers médicaux selon les critères
  const filteredRecords = medicalRecords.filter(record => {
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesDate = !dateFilter || record.date === dateFilter;
    const matchesSearch = !searchTerm || 
      record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesDate && matchesSearch;
  });

  const handleCreateNewRecord = () => {
    handleSubTabChange("select-patient-for-record");
  };

  // Fonction pour voir les détails d'un patient
  const handleViewPatient = async (patientId) => {
    try {
      // Vérifier d'abord si on a déjà les informations du patient dans la liste
      let patient = patients.find(p => p.id === patientId);
      
      if (patient) {
        // Si on a le patient dans la liste, l'utiliser directement
        await handlePatientSelect(patient);
      } else {
        // Sinon, créer un objet patient temporaire avec l'ID
        // Le handlePatientSelect se chargera de récupérer les détails complets
        const tempPatient = { id: patientId };
        await handlePatientSelect(tempPatient);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du patient:", error);
      setDocumentActionError("Impossible de charger les détails du patient.");
      setTimeout(() => setDocumentActionError(null), 5000);
    }
  };

  // Fonction pour prévisualiser un document
  const handlePreviewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  // Fonction pour télécharger un document
  const handleDownloadDocument = async (docId) => {
    try {
      setDocumentActionLoading(true);
      
      const response = await axios.get(`/api/doctor/documents/${docId}/download`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        responseType: 'blob'
      });
      
      // Extraction du nom du fichier depuis l'en-tête de la réponse
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      // Création d'un objet URL pour le fichier téléchargé
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Création d'un lien temporaire pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setDocumentActionSuccess(`Document téléchargé avec succès`);
      setTimeout(() => setDocumentActionSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      setDocumentActionError("Impossible de télécharger le document. Veuillez réessayer plus tard.");
      setTimeout(() => setDocumentActionError(null), 5000);
    } finally {
      setDocumentActionLoading(false);
    }
  };

  // Grouper les dossiers par date
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    if (!groups[record.date]) {
      groups[record.date] = [];
    }
    groups[record.date].push(record);
    return groups;
  }, {});

  // Trier les dates en ordre décroissant
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a));

  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement des dossiers médicaux..." color="primary" />;
  }

  if (error) {
    return (
      <div className="error-state">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button 
          className="btn-primary" 
          onClick={() => window.location.reload()}
          disabled={actionLoading}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="medical-records-container">
      {/* Messages d'action pour les documents */}
      {documentActionSuccess && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {documentActionSuccess}
        </div>
      )}
      
      {documentActionError && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {documentActionError}
        </div>
      )}

      <div className="section-header">
        <h2>Dossiers Médicaux</h2>
        <button 
          className="btn-primary"
          onClick={handleCreateNewRecord}
          disabled={actionLoading || documentActionLoading}
        >
          <i className="fas fa-plus"></i> Nouveau dossier médical
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="filter-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher un patient ou un diagnostic..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
            disabled={documentActionLoading}
          >
            <option value="all">Tous les types</option>
            <option value="consultation">Consultation</option>
            <option value="analyse">Analyse</option>
            <option value="chirurgie">Chirurgie</option>
            <option value="suivi">Suivi</option>
            <option value="autre">Autre</option>
          </select>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
            disabled={documentActionLoading}
          />
          <button 
            className="btn-outline"
            onClick={() => {
              setFilterType("all");
              setDateFilter("");
              setSearchTerm("");
            }}
            disabled={actionLoading || documentActionLoading}
          >
            <i className="fas fa-sync-alt"></i> Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des dossiers médicaux */}
      <div className="records-content">
        {filteredRecords.length > 0 ? (
          <div className="records-timeline">
            {sortedDates.map(date => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h3>{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                </div>
                {groupedRecords[date].map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-date">
                      <span className="date">{record.date}</span>
                      <span className="type">{record.type}</span>
                    </div>
                    <div className="record-content">
                      <h4>Patient: {record.patient_name}</h4>
                      <div className="record-details">
                        <p><strong>Diagnostic:</strong> {record.diagnosis}</p>
                        <p><strong>Notes:</strong> {record.notes || "Aucune note"}</p>
                        {record.documents && record.documents.length > 0 && (
                          <div className="record-documents">
                            <p><strong>Documents:</strong></p>
                            <ul className="document-list">
                              {record.documents.map((doc) => (
                                <li key={doc.id} className="document-item">
                                  <span className="document-icon">
                                    <i className={`fas ${getDocumentIcon(doc.type)}`}></i>
                                  </span>
                                  <span className="document-name">{doc.name}</span>
                                  <div className="document-actions">
                                    <button 
                                      className="btn-icon"
                                      onClick={() => handlePreviewDocument(doc)}
                                      disabled={documentActionLoading}
                                      title="Prévisualiser"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn-icon"
                                      onClick={() => handleDownloadDocument(doc.id)}
                                      disabled={documentActionLoading}
                                      title="Télécharger"
                                    >
                                      <i className="fas fa-download"></i>
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="record-actions">
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => handleViewPatient(record.patient_id)}
                          disabled={actionLoading || documentActionLoading}
                        >
                          <i className="fas fa-user"></i> Voir patient
                        </button>
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => handleViewPatient(record.patient_id)}
                          disabled={actionLoading || documentActionLoading}
                        >
                          <i className="fas fa-prescription"></i> Nouvelle ordonnance
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-medical-alt"></i>
            <h3>Aucun dossier médical trouvé</h3>
            <p>Aucun dossier ne correspond à vos critères de recherche</p>
            <button 
              className="btn-primary"
              onClick={handleCreateNewRecord}
              disabled={actionLoading || documentActionLoading}
            >
              Créer un nouveau dossier
            </button>
          </div>
        )}
      </div>

      {/* Prévisualisation du document */}
      {showDocumentViewer && selectedDocument && (
        <div className="modal-overlay">
          <div className="modal-container">
            <DocumentViewer 
              documentId={selectedDocument.id} 
              onClose={() => {
                setShowDocumentViewer(false);
                setSelectedDocument(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Fonction utilitaire pour déterminer l'icône en fonction du type de document
function getDocumentIcon(type) {
  if (!type) return 'fa-file';
  
  type = type.toLowerCase();
  
  if (type.includes('pdf')) {
    return 'fa-file-pdf';
  } else if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) {
    return 'fa-file-image';
  } else if (type.includes('word') || type.includes('doc')) {
    return 'fa-file-word';
  } else if (type.includes('excel') || type.includes('xls')) {
    return 'fa-file-excel';
  } else if (type.includes('powerpoint') || type.includes('ppt')) {
    return 'fa-file-powerpoint';
  } else if (type.includes('text') || type.includes('txt')) {
    return 'fa-file-alt';
  } else if (type.includes('zip') || type.includes('compressed')) {
    return 'fa-file-archive';
  } else if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) {
    return 'fa-file-audio';
  } else if (type.includes('video') || type.includes('mp4')) {
    return 'fa-file-video';
  } else if (type.includes('code') || type.includes('json') || type.includes('xml') || type.includes('html')) {
    return 'fa-file-code';
  } else {
    return 'fa-file';
  }
}

export default DoctorMedicalRecords;