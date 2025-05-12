// src/components/patient-dashboard/Profile.jsx
import React, { useState } from "react";
import EditProfileForm from "./EditProfileForm";
import PhotoUpload from "./PhotoUpload";

const Profile = ({ user, profile, updateProfile, updatePhoto, updatePassword, actionLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

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

  const handleSaveProfile = (updatedProfile) => {
    updateProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleSavePhoto = (photoFile) => {
    updatePhoto(photoFile);
    setIsChangingPhoto(false);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    
    if (validatePasswordForm()) {
      updatePassword(passwordForm);
      setIsChangingPassword(false);
    }
  };

  if (isEditing) {
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
              <h3>Modifier mon profil</h3>
              <p>Mettre à jour mes informations personnelles et médicales</p>
            </div>
          </div>
          
          <EditProfileForm 
            profile={profile} 
            onSave={handleSaveProfile} 
            onCancel={handleCancelEdit}
            actionLoading={actionLoading}
          />
        </div>
      </div>
    );
  }

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
            <h3>{user?.name}</h3>
            <p>Patient depuis {new Date().getFullYear()}</p>
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
              <div className="detail-value">{user?.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user?.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Téléphone</div>
              <div className="detail-value">
                {profile?.phone || "Non renseigné"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Date de naissance</div>
              <div className="detail-value">
                {profile?.dateOfBirth || "Non renseignée"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Adresse</div>
              <div className="detail-value">
                {profile?.address || "Non renseignée"}
              </div>
            </div>
          </div>

          <div className="detail-group">
            <h4>Informations médicales</h4>
            <div className="detail-row">
              <div className="detail-label">Groupe sanguin</div>
              <div className="detail-value">
                {profile?.bloodType || "Non renseigné"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Allergies</div>
              <div className="detail-value">
                {profile?.allergies && profile.allergies.length > 0
                  ? profile.allergies.join(", ")
                  : "Non renseignées"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Maladies chroniques</div>
              <div className="detail-value">
                {profile?.chronicDiseases && profile.chronicDiseases.length > 0
                  ? profile.chronicDiseases.join(", ")
                  : "Non renseignées"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Contact d'urgence</div>
              <div className="detail-value">
                {profile?.emergencyContact || "Non renseigné"}
              </div>
            </div>
            {profile?.medicalHistory && (
              <div className="detail-row">
                <div className="detail-label">Antécédents médicaux</div>
                <div className="detail-value">{profile.medicalHistory}</div>
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
            onClick={handlePasswordClick}
            disabled={actionLoading}
          >
            <i className="fas fa-key"></i> Changer le mot de passe
          </button>
        </div>
      </div>
      <div className="privacy-notice">
        <h4>Confidentialité des données</h4>
        <p>
          Vos données personnelles et médicales sont strictement confidentielles
          et protégées. Elles ne sont accessibles qu'aux professionnels de santé
          qui vous suivent. Vous pouvez demander à tout moment l'accès, la
          modification ou la suppression de vos données.
        </p>
      </div>
    </div>
  );
};

export default Profile;