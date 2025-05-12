// src/components/admin-dashboard/AdminProfile.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "../../axios";

const AdminProfile = ({ user, actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // État pour le formulaire d'édition du profil
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });

  // État pour le formulaire de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Charger les données du profil au chargement du composant
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/admin/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        setProfile(response.data.profile);
        // Initialiser le formulaire avec les données du profil
        setFormData({
          name: response.data.profile.name || "",
          email: response.data.profile.email || "",
          password: "",
          password_confirmation: "",
          phone: response.data.profile.phone || "",
          bio: response.data.profile.bio || "",
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
    setIsChangingPassword(false);
  };

  const handlePhotoClick = () => {
    setIsChangingPhoto(true);
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  const handlePasswordClick = () => {
    setIsChangingPassword(true);
    setIsEditing(false);
    setIsChangingPhoto(false);
    // Réinitialiser le formulaire de mot de passe
    setPasswordForm({
      current_password: "",
      password: "",
      password_confirmation: ""
    });
    setPasswordErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCancelPhotoChange = () => {
    setIsChangingPhoto(false);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });

    // Effacer les erreurs lorsque l'utilisateur modifie le champ
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: null
      });
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.current_password) {
      newErrors.current_password = "Le mot de passe actuel est requis";
    }
    
    if (!passwordForm.password) {
      newErrors.password = "Le nouveau mot de passe est requis";
    } else if (passwordForm.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    if (!passwordForm.password_confirmation) {
      newErrors.password_confirmation = "La confirmation du mot de passe est requise";
    } else if (passwordForm.password !== passwordForm.password_confirmation) {
      newErrors.password_confirmation = "Les mots de passe ne correspondent pas";
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      const response = await axios.put("/api/admin/profile", dataToSubmit, {
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

  const handleSavePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setActionLoading(true);
    
    try {
      await axios.put("/api/admin/password", passwordForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      setActionSuccess("Mot de passe mis à jour avec succès!");
      setIsChangingPassword(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du mot de passe:", err);
      
      // Gestion des erreurs de validation du serveur
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach(field => {
          serverErrors[field] = err.response.data.errors[field][0];
        });
        setPasswordErrors(serverErrors);
      } else {
        setActionError(
          err.response?.data?.message ||
            "Impossible de mettre à jour le mot de passe. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSavePhoto(file);
    }
  };

  const handleSavePhoto = async (photoFile) => {
    setActionLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("profile_photo", photoFile);
      
      const response = await axios.post("/api/admin/profile/photo", formData, {
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
      <div className="profile-container">
        <div className="profile-info-card">
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
      <div className="profile-container">
        <div className="profile-info-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-title">
              <h3>Modifier mon profil</h3>
              <p>Mettre à jour mes informations personnelles</p>
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
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  disabled={actionLoading}
                  placeholder="Décrivez votre expérience et votre rôle..."
                ></textarea>
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

  // Interface de changement de mot de passe
  if (isChangingPassword) {
    return (
      <div className="profile-container">
        <div className="profile-info-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
              ) : (
                <i className="fas fa-user-circle"></i>
              )}
            </div>
            <div className="profile-title">
              <h3>Modification du mot de passe</h3>
              <p>Sécurisez votre compte avec un nouveau mot de passe</p>
            </div>
          </div>
          
          <form onSubmit={handleSavePassword} className="edit-profile-form">
            <div className="form-section">
              <h4>Changer votre mot de passe</h4>
              
              <div className="form-group">
                <label htmlFor="current_password">Mot de passe actuel</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  disabled={actionLoading}
                  className={passwordErrors.current_password ? "error" : ""}
                />
                {passwordErrors.current_password && (
                  <span className="error-message">{passwordErrors.current_password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  disabled={actionLoading}
                  className={passwordErrors.password ? "error" : ""}
                />
                {passwordErrors.password && (
                  <span className="error-message">{passwordErrors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={passwordForm.password_confirmation}
                  onChange={handlePasswordChange}
                  disabled={actionLoading}
                  className={passwordErrors.password_confirmation ? "error" : ""}
                />
                {passwordErrors.password_confirmation && (
                  <span className="error-message">{passwordErrors.password_confirmation}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={actionLoading}
              >
                {actionLoading ? "Modification en cours..." : "Changer mon mot de passe"}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancelPasswordChange}
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
      <div className="profile-container">
        <div className="profile-info-card">
          <PhotoUpload 
            onSave={handleSavePhoto} 
            onCancel={handleCancelPhotoChange} 
            actionLoading={actionLoading}
            profile={profile}
          />
        </div>
      </div>
    );
  }

  // Interface principale du profil
  return (
    <div className="profile-container">
      <div className="profile-info-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
          </div>
          <div className="profile-title">
            <h3>{profile?.name}</h3>
            <p>Administrateur depuis {new Date().getFullYear()}</p>
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
                <span className="role-badge admin">Administrateur</span>
              </div>
            </div>
          </div>

          <div className="detail-group">
            <h4>Informations professionnelles</h4>
            <div className="detail-row">
              <div className="detail-label">Biographie</div>
              <div className="detail-value">
                {profile?.bio || "Non renseignée"}
              </div>
            </div>
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
            onClick={handlePasswordClick}
            disabled={actionLoading}
          >
            <i className="fas fa-key"></i> Changer le mot de passe
          </button>
        </div>
      </div>
      <div className="privacy-notice">
        <h4>Sécurité du compte administrateur</h4>
        <p>
          En tant qu'administrateur, vous avez accès à des données sensibles de la clinique.
          Veillez à maintenir votre mot de passe sécurisé et à ne jamais partager vos identifiants.
          Toutes vos actions sont enregistrées dans le système pour des raisons de sécurité.
        </p>
      </div>
    </div>
  );
};

// Composant de téléchargement de photo
const PhotoUpload = ({ onSave, onCancel, actionLoading, profile }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Initialiser l'aperçu avec la photo existante s'il y en a une
  useEffect(() => {
    if (profile?.photoUrl) {
      setPreview(profile.photoUrl);
    }
  }, [profile]);

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
      <h3>Photo de profil</h3>
      
      <div className="upload-preview">
        {preview ? (
          <img src={preview} alt="Aperçu" className="profile-photo-preview" />
        ) : (
          <div className="photo-placeholder">
            <i className="fas fa-user-circle"></i>
            <p>Aucune photo</p>
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
          <li>Utilisez une photo de visage claire et récente</li>
          <li>Assurez-vous que votre visage est bien visible</li>
          <li>Format accepté: JPEG ou PNG</li>
          <li>Taille maximale: 2 Mo</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminProfile;