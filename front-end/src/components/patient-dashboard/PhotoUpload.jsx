// src/components/patient-dashboard/PhotoUpload.jsx
import React, { useState, useRef } from "react";

const PhotoUpload = ({ onSave, onCancel, actionLoading }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      setFile(selectedFile);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onSave(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="photo-upload-container">
      <h3>Changer la photo de profil</h3>
      
      <div className="upload-preview">
        {preview ? (
          <img src={preview} alt="Aperçu" className="profile-photo-preview" />
        ) : (
          <div className="photo-placeholder">
            <i className="fas fa-user-circle"></i>
            <p>Sélectionnez une photo</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*"
          className="file-input"
          disabled={actionLoading}
        />
        
        <div className="upload-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={triggerFileInput}
            disabled={actionLoading}
          >
            <i className="fas fa-image"></i> Choisir une photo
          </button>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!file || actionLoading}
            >
              {actionLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onCancel}
              disabled={actionLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      </form>
      
      <div className="photo-guidelines">
        <h4>Conseils pour la photo</h4>
        <ul>
          <li>Utilisez une photo de visage claire et récente</li>
          <li>Assurez-vous que votre visage est bien visible</li>
          <li>Format recommandé: JPEG ou PNG</li>
          <li>Taille maximale: 5 Mo</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoUpload;