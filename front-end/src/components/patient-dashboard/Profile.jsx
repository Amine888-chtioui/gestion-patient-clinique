// src/components/patient-dashboard/Profile.jsx - Version optimisée
import React, { useState, useCallback } from "react";
import EditProfileForm from "./EditProfileForm";
import PhotoUpload from "./PhotoUpload";

const Profile = ({ user, profile, updateProfile, updatePhoto, actionLoading }) => {
  const [editMode, setEditMode] = useState("view"); // "view", "edit", "photo", "password"
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Handlers pour les modes d'édition
  const handleModeChange = useCallback((mode) => {
    setEditMode(mode);
    if (mode === "password") {
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: ""
      });
      setPasswordErrors({});
    }
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditMode("view");
  }, []);

  // Gestion du formulaire de mot de passe
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));

    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [passwordErrors]);

  const validatePasswordForm = useCallback(() => {
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
  }, [passwordForm]);

  const handleSaveProfile = useCallback((updatedProfile) => {
    updateProfile(updatedProfile);
    setEditMode("view");
  }, [updateProfile]);

  const handleSavePhoto = useCallback((photoFile) => {
    updatePhoto(photoFile);
    setEditMode("view");
  }, [updatePhoto]);

  const handleSavePassword = useCallback((e) => {
    e.preventDefault();
    
    if (validatePasswordForm()) {
      // updatePassword(passwordForm); // Cette fonction devrait être passée en props si nécessaire
      setEditMode("view");
    }
  }, [validatePasswordForm]);

  // Rendu conditionnel basé sur le mode
  switch (editMode) {
    case "edit":
      return (
        <div className="profile-container">
          <div className="profile-info-card">
            <ProfileHeader profile={profile} title="Modifier mon profil" />
            <EditProfileForm 
              profile={profile} 
              onSave={handleSaveProfile} 
              onCancel={handleCancelEdit}
              actionLoading={actionLoading}
            />
          </div>
        </div>
      );

    case "photo":
      return (
        <div className="profile-container">
          <div className="profile-info-card">
            <PhotoUpload 
              onSave={handleSavePhoto} 
              onCancel={handleCancelEdit} 
              actionLoading={actionLoading}
              profile={profile}
            />
          </div>
        </div>
      );

    case "password":
      return (
        <div className="profile-container">
          <div className="profile-info-card">
            <ProfileHeader 
              profile={profile} 
              title="Modification du mot de passe"
              subtitle="Sécurisez votre compte avec un nouveau mot de passe"
            />
            <PasswordForm
              passwordForm={passwordForm}
              passwordErrors={passwordErrors}
              onPasswordChange={handlePasswordChange}
              onSubmit={handleSavePassword}
              onCancel={handleCancelEdit}
              actionLoading={actionLoading}
            />
          </div>
        </div>
      );

    default: // "view"
      return (
        <div className="profile-container">
          <div className="profile-info-card">
            <ProfileHeader 
              profile={profile} 
              user={user}
              onPhotoClick={() => handleModeChange("photo")}
              actionLoading={actionLoading}
            />

            <ProfileDetails user={user} profile={profile} />

            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={() => handleModeChange("edit")}
                disabled={actionLoading}
              >
                <i className="fas fa-edit"></i> Modifier le profil
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleModeChange("password")}
                disabled={actionLoading}
              >
                <i className="fas fa-key"></i> Changer le mot de passe
              </button>
            </div>
          </div>
          <PrivacyNotice />
        </div>
      );
  }
};

// Composant Header du profil
const ProfileHeader = React.memo(({ profile, user, title, subtitle, onPhotoClick, actionLoading }) => (
  <div className="profile-header">
    <div className="profile-avatar">
      {profile?.photoUrl ? (
        <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
      ) : (
        <i className="fas fa-user-circle"></i>
      )}
    </div>
    <div className="profile-title">
      <h3>{title || user?.name}</h3>
      <p>{subtitle || `Patient depuis ${new Date().getFullYear()}`}</p>
    </div>
    {onPhotoClick && (
      <button
        className="btn-outline"
        onClick={onPhotoClick}
        disabled={actionLoading}
      >
        <i className="fas fa-camera"></i> Changer la photo
      </button>
    )}
  </div>
));

// Composant pour afficher les détails du profil
const ProfileDetails = React.memo(({ user, profile }) => (
  <div className="profile-details">
    <div className="detail-group">
      <h4>Informations personnelles</h4>
      <DetailRow label="Nom complet" value={user?.name} />
      <DetailRow label="Email" value={user?.email} />
      <DetailRow label="Téléphone" value={profile?.phone || "Non renseigné"} />
      <DetailRow label="Date de naissance" value={profile?.dateOfBirth || "Non renseignée"} />
      <DetailRow label="Adresse" value={profile?.address || "Non renseignée"} />
    </div>

    <div className="detail-group">
      <h4>Informations médicales</h4>
      <DetailRow label="Groupe sanguin" value={profile?.bloodType || "Non renseigné"} />
      <DetailRow 
        label="Allergies" 
        value={
          profile?.allergies && profile.allergies.length > 0
            ? profile.allergies.join(", ")
            : "Non renseignées"
        } 
      />
      <DetailRow 
        label="Maladies chroniques" 
        value={
          profile?.chronicDiseases && profile.chronicDiseases.length > 0
            ? profile.chronicDiseases.join(", ")
            : "Non renseignées"
        } 
      />
      <DetailRow label="Contact d'urgence" value={profile?.emergencyContact || "Non renseigné"} />
      {profile?.medicalHistory && (
        <DetailRow label="Antécédents médicaux" value={profile.medicalHistory} />
      )}
    </div>
  </div>
));

// Composant pour une ligne de détail
const DetailRow = React.memo(({ label, value }) => (
  <div className="detail-row">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value}</div>
  </div>
));

// Composant formulaire de mot de passe
const PasswordForm = React.memo(({
  passwordForm,
  passwordErrors,
  onPasswordChange,
  onSubmit,
  onCancel,
  actionLoading,
}) => (
  <form onSubmit={onSubmit} className="edit-profile-form">
    <div className="form-section">
      <h4>Changer votre mot de passe</h4>
      
      <PasswordField
        id="current_password"
        label="Mot de passe actuel"
        value={passwordForm.current_password}
        onChange={onPasswordChange}
        error={passwordErrors.current_password}
        disabled={actionLoading}
      />

      <PasswordField
        id="password"
        label="Nouveau mot de passe"
        value={passwordForm.password}
        onChange={onPasswordChange}
        error={passwordErrors.password}
        disabled={actionLoading}
      />

      <PasswordField
        id="password_confirmation"
        label="Confirmer le nouveau mot de passe"
        value={passwordForm.password_confirmation}
        onChange={onPasswordChange}
        error={passwordErrors.password_confirmation}
        disabled={actionLoading}
      />
    </div>

    <div className="form-actions">
      <button type="submit" className="btn-primary" disabled={actionLoading}>
        {actionLoading ? "Modification en cours..." : "Changer mon mot de passe"}
      </button>
      <button type="button" className="btn-secondary" onClick={onCancel} disabled={actionLoading}>
        Annuler
      </button>
    </div>
  </form>
));

// Composant champ de mot de passe
const PasswordField = React.memo(({ id, label, value, onChange, error, disabled }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input
      type="password"
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
    {error && <span className="error-message">{error}</span>}
  </div>
));

// Composant notice de confidentialité
const PrivacyNotice = React.memo(() => (
  <div className="privacy-notice">
    <h4>Confidentialité des données</h4>
    <p>
      Vos données personnelles et médicales sont strictement confidentielles
      et protégées. Elles ne sont accessibles qu'aux professionnels de santé
      qui vous suivent. Vous pouvez demander à tout moment l'accès, la
      modification ou la suppression de vos données.
    </p>
  </div>
));

export default Profile;