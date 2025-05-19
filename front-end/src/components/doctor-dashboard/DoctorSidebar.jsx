// src/components/doctor-dashboard/DoctorSidebar.jsx
import React from "react";

const DoctorSidebar = ({ 
  user, 
  activeTab, 
  handleTabChange, 
  handleLogout, 
  actionLoading,
  profile // Prop for profile data
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
      {profile?.speciality && <p className="doctor-speciality">{profile.speciality}</p>}
      {profile?.service && (
        <div className="service-info">
          <span className="service-badge">
            {profile.service.icon && <i className={`fas ${profile.service.icon}`}></i>}
            {profile.service.name}
          </span>
        </div>
      )}
      <span className="badge badge-doctor">Médecin</span>
    </div>

    <nav className="sidebar-nav">
      <ul>
        {[
          { id: "overview", icon: "home", label: "Tableau de bord" },
          { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
          { id: "patients", icon: "user-injured", label: "Patients" },
          { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
          { id: "medical-records", icon: "file-medical", label: "Dossiers médicaux" },
          { id: "prescriptions", icon: "prescription", label: "Ordonnances" },
          { id: "schedules", icon: "clock", label: "Horaires" }
          
        ].map(item => (
          <li key={item.id} className={activeTab === item.id ? "active" : ""}>
            <button onClick={() => handleTabChange(item.id)} disabled={actionLoading}>
              <i className={`fas fa-${item.icon}`}></i> {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default DoctorSidebar;