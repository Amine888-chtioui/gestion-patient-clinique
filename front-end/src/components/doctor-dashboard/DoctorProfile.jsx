// src/components/doctor-dashboard/DoctorProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "../../axios";
import "./doctor-profile.css";

const DoctorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    speciality: "",
    phone: "",
    bio: "",
    education: "",
    experience: "",
    password: "",
    password_confirmation: ""
  });

  // Charger les données du profil au chargement du composant
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/doctor/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setProfile(response.data.profile);
        // Initialiser le formulaire avec les données du profil
        setFormData({
          name: response.data.profile.name || "",
          email: response.data.profile.email || "",
          speciality: response.data.profile.speciality || "",
          phone: response.data.profile.phone || "",
          bio: response.data.profile.bio || "",
          education: response.data.profile.education || "",
          experience: response.data.profile.experience || "",
          password: "",
          password_confirmation: ""
        });
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        setActionError("Impossible de charger les informations du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setIsChangingPhoto(false);
  };

  const handlePhotoClick = () => {
    setIsChangingPhoto(true);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCancelPhotoChange = () => {
    setIsChangingPhoto(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      // Remove password fields if empty
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
        delete dataToSubmit.password_confirmation;
      }

      const response = await axios.put("/api/doctor/profile", dataToSubmit, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setActionSuccess("Profil mis à jour avec succès!");
      setProfile(response.data.profile);
      setIsEditing(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      setActionError(
        err.response?.data?.message ||
          "Impossible de mettre à jour le profil. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePhoto = async (photoFile) => {
    setActionLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("profile_photo", photoFile);
      
      const response = await axios.post("/api/doctor/profile/photo", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Mettre à jour le profil avec la nouvelle URL de photo
      setProfile({
        ...profile,
        photoUrl: response.data.photo_url
      });
      
      setActionSuccess("Photo de profil mise à jour avec succès!");
      setIsChangingPhoto(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la photo:", err);
      setActionError(
        err.response?.data?.message ||
          "Impossible de mettre à jour la photo. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="doctor-profile-container">
        <div className="profile-card">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Interface de modification du profil
  if (isEditing) {
    return (
      <div className="doctor-profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="profile-title">
              <h3>Modifier mon profil</h3>
              <p>Mettre à jour mes informations personnelles et professionnelles</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-section">
              <h4>Informations personnelles</h4>
              
              <div className="form-group">
                <label htmlFor="name">Nom complet</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>
            </div>
            
            <div className="form-section">
              <h4>Informations professionnelles</h4>
              
              <div className="form-group">
                <label htmlFor="speciality">Spécialité</label>
                <input
                  type="text"
                  id="speciality"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  disabled={actionLoading}
                  placeholder="Décrivez votre parcours et votre approche médicale..."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="education">Formation académique</label>
                <textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                  placeholder="Vos diplômes et formations..."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="experience">Expérience professionnelle</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows="3"
                  disabled={actionLoading}
                  placeholder="Vos expériences professionnelles..."
                ></textarea>
              </div>
            </div>

            <div className="form-section">
              <h4>Modifier le mot de passe</h4>
              <p className="form-info">
                Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe
              </p>
              
              <div className="form-group">
                <label htmlFor="password">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={actionLoading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Interface de changement de photo
  if (isChangingPhoto) {
    return (
      <div className="doctor-profile-container">
        <div className="profile-card">
          <PhotoUpload 
            onSave={handleSavePhoto} 
            onCancel={handleCancelPhotoChange} 
            actionLoading={actionLoading}
          />
        </div>
      </div>
    );
  }

  // Interface principale du profil
  return (
    <div className="doctor-profile-container">
      {actionSuccess && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {actionSuccess}
        </div>
      )}
      
      {actionError && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {actionError}
        </div>
      )}
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
            ) : (
              <i className="fas fa-user-md"></i>
            )}
          </div>
          <div className="profile-title">
            <h3>{profile?.name}</h3>
            <p>{profile?.speciality || "Médecin"}</p>
          </div>
          <button
            className="btn-outline"
            onClick={handlePhotoClick}
            disabled={actionLoading}
          >
            <i className="fas fa-camera"></i> Changer la photo
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-group">
            <h4>Informations personnelles</h4>
            <div className="detail-row">
              <div className="detail-label">Nom complet</div>
              <div className="detail-value">{profile?.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">{profile?.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Téléphone</div>
              <div className="detail-value">
                {profile?.phone || "Non renseigné"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Rôle</div>
              <div className="detail-value">
                <span className="role-badge doctor">Médecin</span>
              </div>
            </div>
          </div>

          <div className="detail-group">
            <h4>Informations professionnelles</h4>
            <div className="detail-row">
              <div className="detail-label">Spécialité</div>
              <div className="detail-value">
                {profile?.speciality || "Non renseignée"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Biographie</div>
              <div className="detail-value">
                {profile?.bio || "Non renseignée"}
              </div>
            </div>
            {profile?.education && (
              <div className="detail-row">
                <div className="detail-label">Formation</div>
                <div className="detail-value">{profile.education}</div>
              </div>
            )}
            {profile?.experience && (
              <div className="detail-row">
                <div className="detail-label">Expérience</div>
                <div className="detail-value">{profile.experience}</div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="btn-primary"
            onClick={handleEditClick}
            disabled={actionLoading}
          >
            <i className="fas fa-edit"></i> Modifier le profil
          </button>
          <button
            className="btn-secondary"
            onClick={() => alert("Fonctionnalité en cours de développement")}
            disabled={actionLoading}
          >
            <i className="fas fa-key"></i> Changer le mot de passe
          </button>
        </div>
      </div>
      <div className="privacy-notice">
        <h4>Confidentialité des données</h4>
        <p>
          En tant que médecin, vous avez accès à des données sensibles de patients.
          Veillez à maintenir votre compte sécurisé et à respecter la confidentialité des informations médicales.
          Votre profil est visible par les patients de la clinique.
        </p>
      </div>
    </div>
  );
};

// Composant de téléchargement de photo
const PhotoUpload = ({ onSave, onCancel, actionLoading }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Vérification du type et de la taille du fichier
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validTypes.includes(selectedFile.type)) {
        alert('Veuillez sélectionner une image au format JPEG, PNG ou JPG.');
        return;
      }
      
      if (selectedFile.size > maxSize) {
        alert('La taille de l\'image ne doit pas dépasser 2 MB.');
        return;
      }
      
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
            <i className="fas fa-user-md"></i>
            <p>Sélectionnez une photo</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/jpeg, image/png, image/jpg"
          className="file-input"
          name="profile_photo"
          disabled={actionLoading}
          style={{ display: 'none' }}
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
          <li>Utilisez une photo professionnelle</li>
          <li>Assurez-vous que votre visage est bien visible</li>
          <li>Format accepté: JPEG ou PNG</li>
          <li>Taille maximale: 2 Mo</li>
        </ul>
      </div>
    </div>
  );
};

export default DoctorProfile;