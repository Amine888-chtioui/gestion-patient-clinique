import React from "react";

const Sidebar = ({
  user,
  activeTab,
  handleTabChange,
  actionLoading,
  profile,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
        <h2>Espace Patient</h2>
      </div>

      <div className="user-info">
        <div className="avatar">
          {/* Photo stockée dans user.profile_photo via l'API */}
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt="Photo de profil"
              className="profile-photo"
            />
          ) : (
            <i className="fas fa-user-circle"></i>
          )}
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
            { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
          ].map((item) => (
            <li key={item.id} className={activeTab === item.id ? "active" : ""}>
              <button onClick={() => handleTabChange(item.id)}>
                <i className={`fas fa-${item.icon}`}></i> {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;