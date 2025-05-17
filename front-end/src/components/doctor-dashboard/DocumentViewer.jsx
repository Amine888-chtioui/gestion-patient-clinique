// src/components/doctor-dashboard/DocumentViewer.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import UnifiedLoadingSpinner from "../common/UnifiedLoadingSpinner";

const DocumentViewer = ({ documentId, onClose }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du document
        const detailsResponse = await axios.get(`/api/doctor/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setDocument(detailsResponse.data.document);
        
        // Récupérer le contenu du document pour la prévisualisation
        const contentResponse = await axios.get(`/api/doctor/documents/${documentId}/preview`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: 'blob'
        });
        
        // Créer une URL pour prévisualiser le document
        const url = window.URL.createObjectURL(new Blob([contentResponse.data]));
        setPreviewUrl(url);
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement du document:", err);
        setError("Impossible de charger le document. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };

    fetchDocumentDetails();
    
    // Nettoyage de l'URL lors du démontage du composant
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [documentId]);

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/doctor/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: 'blob'
      });
      
      // Extraction du nom du fichier
      const contentDisposition = response.headers['content-disposition'];
      let filename = document?.name || 'document';
      
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
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      setError("Impossible de télécharger le document.");
    }
  };

  const renderPreview = () => {
    if (!document || !previewUrl) return null;
    
    const fileType = document.type ? document.type.toLowerCase() : '';
    
    if (fileType.includes('pdf')) {
      return (
        <iframe 
          src={previewUrl} 
          title={document.name} 
          width="100%" 
          height="500px" 
          className="document-preview-frame"
        />
      );
    } else if (fileType.includes('image')) {
      return (
        <img 
          src={previewUrl} 
          alt={document.name} 
          className="document-preview-image" 
        />
      );
    } else {
      return (
        <div className="document-no-preview">
          <i className="fas fa-file-alt"></i>
          <p>Prévisualisation non disponible pour ce type de fichier.</p>
          <p>Veuillez télécharger le document pour le consulter.</p>
        </div>
      );
    }
  };

  if (loading) {
    return <UnifiedLoadingSpinner text="Chargement du document..." />;
  }

  if (error) {
    return (
      <div className="document-error">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={onClose}>Fermer</button>
      </div>
    );
  }

  return (
    <div className="document-viewer">
      <div className="document-viewer-header">
        <h3>{document?.name || "Document"}</h3>
        <div className="document-actions">
          <button className="btn-outline" onClick={handleDownload}>
            <i className="fas fa-download"></i> Télécharger
          </button>
          <button className="btn-outline" onClick={onClose}>
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
      
      <div className="document-viewer-content">
        <div className="document-info">
          <div className="info-item">
            <span className="info-label">Type:</span>
            <span className="info-value">{document?.type || "Inconnu"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Taille:</span>
            <span className="info-value">
              {document?.size ? `${Math.round(document.size / 1024)} KB` : "Inconnue"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Date d'ajout:</span>
            <span className="info-value">
              {document?.created_at ? new Date(document.created_at).toLocaleDateString() : "Inconnue"}
            </span>
          </div>
        </div>
        
        <div className="document-preview-container">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;