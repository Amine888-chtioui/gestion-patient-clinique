// src/components/admin-dashboard/AdminProfile.jsx
import React, { useState, useRef } from "react";
import axios from "../../axios";

const AdminProfile = ({ user, actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    password_confirmation: "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });

  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e) => {
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
      setEditMode(false);
      
      setTimeout(() => {
        setActionSuccess(null);
        // Reload to get fresh user data
        window.location.reload();
      }, 2000);
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

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    
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
      
      setActionSuccess("Photo de profil mise à jour avec succès!");
      setTimeout(() => {
        setActionSuccess(null);
        // Reload to get fresh user data
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la photo:", err);
      setActionError(
        err.response?.data?.message ||
          "Impossible de mettre à jour la photo. Veuillez réessayer plus tard."
      );
    } finally {
      setActionLoading(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-info-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {photoPreview ? (
              <img src={photoPreview} alt="Prévisualisation" className="profile-photo" />
            ) : user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="profile-photo" />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
          </div>
          <div className="profile-title">
            <h3>{user?.name}</h3>
            <p>Administrateur depuis {new Date().getFullYear()}</p>
          </div>
          <button
            className="btn-outline"
            onClick={handlePhotoClick}
            disabled={actionLoading}
          >
            <i className="fas fa-camera"></i> Changer la photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            style={{ display: "none" }}
            accept="image/jpeg, image/png, image/jpg"
          />
        </div>

        {photoFile && (
          <div className="photo-actions" style={{ textAlign: 'center', margin: '1rem 0' }}>
            <button
              className="btn-primary"
              onClick={handlePhotoUpload}
              disabled={actionLoading}
            >
              {actionLoading ? "Enregistrement..." : "Enregistrer la nouvelle photo"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              disabled={actionLoading}
              style={{ marginLeft: '10px' }}
            >
              Annuler
            </button>
          </div>
        )}

        {editMode ? (
          <form onSubmit={handleProfileUpdate} className="edit-profile-form">
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

              <div className="form-row">
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

            <div className="form-section">
              <h4>Modifier le mot de passe</h4>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>
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
                onClick={() => setEditMode(false)}
                disabled={actionLoading}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
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
                  {user?.phone || "Non renseigné"}
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
                  {user?.bio || "Non renseignée"}
                </div>
              </div>
            </div>
          </div>
        )}

        {!editMode && (
          <div className="profile-actions">
            <button
              className="btn-primary"
              onClick={() => setEditMode(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-edit"></i> Modifier le profil
            </button>
          </div>
        )}
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

export default AdminProfile;