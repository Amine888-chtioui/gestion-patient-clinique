// src/components/doctor-dashboard/DocumentViewer.jsx - Version optimisée
import React, { useState, useEffect } from "react";
import doctorApiClient from "../../services/doctorApiClient";
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
        
        const detailsResponse = await doctorApiClient.getDocumentDetails(documentId);
        setDocument(detailsResponse.document);
        
        const contentResponse = await doctorApiClient.getDocumentPreview(documentId);
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
    
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [documentId, previewUrl]);

  const handleDownload = async () => {
    try {
      const response = await doctorApiClient.downloadDocument(documentId);
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = document?.name || 'document';
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
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

// Utilitaires pour les documents
export const getDocumentIcon = (type) => {
  if (!type) return 'fa-file';
  
  type = type.toLowerCase();
  
  if (type.includes('pdf')) return 'fa-file-pdf';
  if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) return 'fa-file-image';
  if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
  if (type.includes('excel') || type.includes('xls')) return 'fa-file-excel';
  if (type.includes('powerpoint') || type.includes('ppt')) return 'fa-file-powerpoint';
  if (type.includes('text') || type.includes('txt')) return 'fa-file-alt';
  if (type.includes('zip') || type.includes('compressed')) return 'fa-file-archive';
  if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return 'fa-file-audio';
  if (type.includes('video') || type.includes('mp4')) return 'fa-file-video';
  if (type.includes('code') || type.includes('json') || type.includes('xml') || type.includes('html')) return 'fa-file-code';
  
  return 'fa-file';
};

export default DocumentViewer;