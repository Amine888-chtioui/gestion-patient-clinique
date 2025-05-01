// src/components/doctor-dashboard/DoctorSidebar.jsx
import React from "react";

const DoctorSidebar = ({ 
  user, 
  activeTab, 
  handleTabChange, 
  handleLogout, 
  actionLoading,
  profile // Ajout du prop profile
}) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
      <h2>Espace Médecin</h2>
    </div>

    <div className="user-info">
      <div className="avatar">
        {profile?.photoUrl ? (
          <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
        ) : (
          <i className="fas fa-user-md"></i>
        )}
      </div>
      <h3>Dr. {user?.name}</h3>
      <p>{user?.email}</p>
      <span className="badge badge-doctor">Médecin</span>
    </div>

    <nav className="sidebar-nav">
      <ul>
        {[
          { id: "overview", icon: "home", label: "Tableau de bord" },
          { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
          { id: "patients", icon: "user-injured", label: "Patients" },
          { id: "profile", icon: "user", label: "Mon profil" }
        ].map(item => (
          <li key={item.id} className={activeTab === item.id ? "active" : ""}>
            <button onClick={() => handleTabChange(item.id)}>
              <i className={`fas fa-${item.icon}`}></i> {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>

    <div className="sidebar-footer">
      <button onClick={handleLogout} className="logout-btn" disabled={actionLoading}>
        {actionLoading ? "Chargement..." : (
          <><i className="fas fa-sign-out-alt"></i> Déconnexion</>
        )}
      </button>
    </div>
  </aside>
);

export default DoctorSidebar;