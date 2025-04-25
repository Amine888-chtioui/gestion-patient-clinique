// src/components/admin-dashboard/AdminSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const AdminSidebar = ({
  user,
  activeTab,
  handleTabChange,
  handleLogout,
  actionLoading,
}) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
        <h2>Espace Administrateur</h2>
      </div>

      <div className="user-info">
        <div className="avatar">
          <i className="fas fa-user-shield"></i>
        </div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <span className="badge badge-admin">Administrateur</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {[
            { id: "overview", icon: "home", label: "Tableau de bord" },
            { id: "patients", icon: "user-injured", label: "Patients" },
            { id: "doctors", icon: "user-md", label: "Médecins" },
            { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
            {
              id: "medicalRecords",
              icon: "file-medical-alt",
              label: "Dossiers médicaux",
            },
            { id: "statistics", icon: "chart-bar", label: "Statistiques" },
            { id: "users", icon: "users-cog", label: "Utilisateurs" },
          ].map((item) => (
            <li key={item.id} className={activeTab === item.id ? "active" : ""}>
              <button onClick={() => handleTabChange(item.id)}>
                <i className={`fas fa-${item.icon}`}></i> {item.label}
              </button>
            </li>
          ))}
          {/* Lien pour la gestion des factures */}
          <li className="sidebar-divider"></li>
          <li>
            <button onClick={() => navigate("/invoices")}>
              <i className="fas fa-file-invoice-dollar"></i> Gestion des factures
            </button>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="logout-btn"
          disabled={actionLoading}
        >
          {actionLoading ? (
            "Chargement..."
          ) : (
            <>
              <i className="fas fa-sign-out-alt"></i> Déconnexion
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;