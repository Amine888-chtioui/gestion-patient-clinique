// src/components/doctor-dashboard/DoctorProfile.jsx
import React, { useState } from "react";

const DoctorProfile = ({ user, updateProfile, actionLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    speciality: user?.speciality || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    education: user?.education || "",
    experience: user?.experience || ""
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Réinitialiser le formulaire avec les données de l'utilisateur
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      speciality: user?.speciality || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      education: user?.education || "",
      experience: user?.experience || ""
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="profile-container">
        <div className="profile-info-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="profile-title">
              <h3>Modifier mon profil</h3>
              <p>Mettre à jour mes informations professionnelles</p>
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

              <div className="form-row">
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
              <h4>Profil professionnel</h4>
              
              <div className="form-group">
                <label htmlFor="bio">Biographie</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Présentez-vous brièvement..."
                  rows="4"
                  disabled={actionLoading}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="education">Formation</label>
                <textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="Votre parcours académique..."
                  rows="3"
                  disabled={actionLoading}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="experience">Expérience professionnelle</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Votre expérience professionnelle..."
                  rows="3"
                  disabled={actionLoading}
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={actionLoading}>
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

  return (
    <div className="profile-container">
      <div className="profile-info-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="profile-title">
            <h3>Dr. {user?.name}</h3>
            <p>{formData.speciality || "Médecin"}</p>
          </div>
          <button
            className="btn-outline"
            onClick={() => alert("Fonctionnalité en cours de développement")}
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
              <div className="detail-value">Dr. {user?.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user?.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Spécialité</div>
              <div className="detail-value">
                {formData.speciality || "Non renseignée"}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Téléphone</div>
              <div className="detail-value">
                {formData.phone || "Non renseigné"}
              </div>
            </div>
          </div>

          <div className="detail-group">
            <h4>Profil professionnel</h4>
            {formData.bio ? (
              <div className="bio-content">
                <p>{formData.bio}</p>
              </div>
            ) : (
              <p className="no-content">Aucune biographie renseignée</p>
            )}
            
            <h5>Formation</h5>
            {formData.education ? (
              <div className="education-content">
                <p>{formData.education}</p>
              </div>
            ) : (
              <p className="no-content">Aucune formation renseignée</p>
            )}
            
            <h5>Expérience professionnelle</h5>
            {formData.experience ? (
              <div className="experience-content">
                <p>{formData.experience}</p>
              </div>
            ) : (
              <p className="no-content">Aucune expérience renseignée</p>
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
        <h4>Accès aux dossiers patients</h4>
        <p>
          En tant que médecin, vous avez accès aux dossiers médicaux de vos patients.
          Veuillez respecter la confidentialité des données et n'y accéder que dans
          un cadre professionnel, conformément au code de déontologie médicale.
        </p>
      </div>
    </div>
  );
};

export default DoctorProfile;