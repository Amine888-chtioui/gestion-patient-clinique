// src/components/doctor-dashboard/MobileNav.jsx
import React from "react";
import { Link } from "react-router-dom";

const MobileNav = ({ activeTab, handleTabChange, appointments = [] }) => {
  // Obtenir le prochain rendez-vous s'il y en a
  const nextAppointment = appointments.length > 0 
    ? appointments.find(apt => new Date(`${apt.date}T${apt.time}`) > new Date())
    : null;

  return (
    <nav className="mobile-nav">
      <div
        className={`mobile-nav-item ${activeTab === "overview" ? "active" : ""}`}
        onClick={() => handleTabChange("overview")}
      >
        <i className="fas fa-home"></i>
        <span className="nav-label">Accueil</span>
      </div>
      <div
        className={`mobile-nav-item ${activeTab === "appointments" ? "active" : ""}`}
        onClick={() => handleTabChange("appointments")}
      >
        <i className="fas fa-calendar-alt"></i>
        <span className="nav-label">RDV</span>
      </div>
      <div
        className={`mobile-nav-item ${activeTab === "patients" ? "active" : ""}`}
        onClick={() => handleTabChange("patients")}
      >
        <i className="fas fa-user-injured"></i>
        <span className="nav-label">Patients</span>
      </div>
      <div
        className={`mobile-nav-item ${activeTab === "medical-records" ? "active" : ""}`}
        onClick={() => handleTabChange("medical-records")}
      >
        <i className="fas fa-file-medical"></i>
        <span className="nav-label">Dossiers</span>
      </div>
      <div
        className={`mobile-nav-item ${activeTab === "prescriptions" ? "active" : ""}`}
        onClick={() => handleTabChange("prescriptions")}
      >
        <i className="fas fa-prescription"></i>
        <span className="nav-label">Ordonnances</span>
      </div>
      <div
        className={`mobile-nav-item ${activeTab === "invoices" ? "active" : ""}`}
        onClick={() => handleTabChange("invoices")}
      >
        <i className="fas fa-file-invoice-dollar"></i>
        <span className="nav-label">Factures</span>
      </div>
      
      {nextAppointment && (
        <div className="appointment-card-mini">
          <div className="appointment-status">
            <span className={`status-badge ${nextAppointment.status.replace(" ", "")}`}>
              {nextAppointment.status}
            </span>
            <span className="appointment-time">{nextAppointment.date} {nextAppointment.time}</span>
          </div>
          <div className="appointment-info-mini">
            <span className="patient-name">{nextAppointment.patient_name}</span>
            <span className="appointment-reason">
              {nextAppointment.reason && nextAppointment.reason.length > 20
                ? `${nextAppointment.reason.substring(0, 20)}...`
                : nextAppointment.reason || "Pas de motif spécifié"}
            </span>
          </div>
          <div className="appointment-actions-mini">
            <Link to={`/doctor/dashboard/appointments`} className="view-details">
              <i className="fas fa-eye"></i> Détails
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MobileNav;