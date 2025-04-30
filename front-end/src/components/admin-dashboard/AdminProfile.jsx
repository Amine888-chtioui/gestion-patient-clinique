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

      // Update the local user data (this would typically be handled by the parent component)
      // In a real implementation, you would want to update the user state in the parent component
      
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
      <div className="profile-header">
        <h2>Mon Profil Administrateur</h2>
        {!editMode && (
          <button
            className="btn-primary"
            onClick={() => setEditMode(true)}
            disabled={actionLoading}
          >
            <i className="fas fa-edit"></i> Modifier le profil
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-photo-section">
          <div className="profile-photo" onClick={handlePhotoClick}>
            {photoPreview ? (
              <img src={photoPreview} alt="Prévisualisation" />
            ) : user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} />
            ) : (
              <div className="no-photo">
                <i className="fas fa-user"></i>
              </div>
            )}
            <div className="photo-overlay">
              <i className="fas fa-camera"></i>
              <span>Changer</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            style={{ display: "none" }}
            accept="image/*"
          />
          {photoFile && (
            <button
              className="btn-primary photo-upload-btn"
              onClick={handlePhotoUpload}
              disabled={actionLoading}
            >
              <i className="fas fa-upload"></i> Mettre à jour la photo
            </button>
          )}
        </div>

        <div className="profile-details">
          {editMode ? (
            <form onSubmit={handleProfileUpdate}>
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
                <label htmlFor="email">Adresse e-mail</label>
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

              <div className="form-group">
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  disabled={actionLoading}
                ></textarea>
              </div>

              <div className="form-section">
                <h3>Changer le mot de passe</h3>
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
                  {actionLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Mise à jour...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Enregistrer
                    </>
                  )}
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
            <div className="profile-info">
              <div className="info-item">
                <div className="info-label">Nom complet</div>
                <div className="info-value">{user?.name}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Adresse e-mail</div>
                <div className="info-value">{user?.email}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Rôle</div>
                <div className="info-value role-badge admin">Administrateur</div>
              </div>

              <div className="info-item">
                <div className="info-label">Téléphone</div>
                <div className="info-value">
                  {user?.phone || "Non renseigné"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label">Biographie</div>
                <div className="info-value">
                  {user?.bio || "Aucune biographie"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;