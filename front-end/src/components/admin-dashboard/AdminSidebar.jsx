// src/components/admin-dashboard/AdminSidebar.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const AdminSidebar = ({ 
  user, 
  activeTab, 
  handleTabChange, 
  handleLogout, 
  actionLoading,
  profile  // Ajout du prop profile
}) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
        <h2>Administration</h2>
      </div>

      <div className="user-info">
        <div className="avatar">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="Photo de profil" className="profile-photo" />
          ) : (
            <i className="fas fa-user-circle"></i>
          )}
        </div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <span className="badge-admin">Administrateur</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {[
            { id: "overview", icon: "home", label: "Tableau de bord" },
            { id: "patients", icon: "user-injured", label: "Patients" },
            { id: "doctors", icon: "user-md", label: "Médecins" },
            { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
            { id: "medicalRecords", icon: "file-medical", label: "Dossiers médicaux" },
            { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
            { id: "payments", icon: "credit-card", label: "Paiements" },
            { id: "statistics", icon: "chart-bar", label: "Statistiques" },
            { id: "users", icon: "users", label: "Utilisateurs" }
          ].map(item => (
            <li key={item.id} className={activeTab === item.id ? "active" : ""}>
              <button 
                onClick={() => handleTabChange(item.id)}
                data-tab={item.id}
              >
                <i className={`fas fa-${item.icon}`}></i> {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn" disabled={actionLoading}>
          {actionLoading ? (
            <span><i className="fas fa-circle-notch fa-spin"></i> Déconnexion...</span>
          ) : (
            <><i className="fas fa-sign-out-alt"></i> Déconnexion</>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;