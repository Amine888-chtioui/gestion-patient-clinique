// src/components/patient-dashboard/Profile.jsx
import React from "react";

const Profile = ({ user, profile, actionLoading }) => (
  <div className="profile-container">
    <div className="profile-info-card">
      <div className="profile-header">
        <div className="profile-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="profile-title">
          <h3>{user?.name}</h3>
          <p>Patient depuis {new Date().getFullYear()}</p>
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
          onClick={() => alert("Fonctionnalité en cours de développement")}
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
        Vos données personnelles et médicales sont strictement confidentielles
        et protégées. Elles ne sont accessibles qu'aux professionnels de santé
        qui vous suivent. Vous pouvez demander à tout moment l'accès, la
        modification ou la suppression de vos données.
      </p>
    </div>
  </div>
);

export default Profile;
