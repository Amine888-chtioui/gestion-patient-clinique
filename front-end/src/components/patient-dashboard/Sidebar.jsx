// src/components/patient-dashboard/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Modifications à apporter au fichier src/components/patient-dashboard/Sidebar.jsx

const Sidebar = ({ user, activeTab, handleTabChange, handleLogout, actionLoading }) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* ... */}

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
          {/* <li className="sidebar-divider"></li>
          <li>
            <button onClick={() => navigate("/patient-invoices")}>
              <i className="fas fa-file-invoice-dollar"></i> Mes factures
            </button>
          </li> */}
        </ul>
      </nav>

      {/* ... */}
    </aside>
  );
};

export default Sidebar;