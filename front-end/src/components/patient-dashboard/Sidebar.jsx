// src/components/patient-dashboard/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Modifications à apporter au fichier src/components/patient-dashboard/Sidebar.jsx

const Sidebar = ({ user, activeTab, handleTabChange, handleLogout, actionLoading }) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
        <div className="sidebar-header">
        <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
        <h2>Espace Patient</h2>
      </div>

      <div className="user-info">
        <div className="avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {[
            { id: "overview", icon: "home", label: "Tableau de bord" },
            { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
            { id: "book", icon: "plus-circle", label: "Prendre RDV" },
            { id: "medicalRecords", icon: "file-medical", label: "Dossier médical" },
            { id: "prescriptions", icon: "prescription", label: "Ordonnances" },
            { id: "invoices", icon: "file-invoice-dollar", label: "Factures" }, // Ajouter cet onglet
            { id: "profile", icon: "user", label: "Mon profil" }
          ].map(item => (
            <li key={item.id} className={activeTab === item.id ? "active" : ""}>
              <button onClick={() => handleTabChange(item.id)}>
                <i className={`fas fa-${item.icon}`}></i> {item.label}
              </button>
            </li>
          ))}
          {/* Supprimer ou garder cette partie selon votre choix */}
          <li className="sidebar-divider"></li>
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
};

export default Sidebar;