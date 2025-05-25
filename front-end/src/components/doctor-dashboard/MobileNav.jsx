// src/components/doctor-dashboard/MobileNav.jsx - Version optimisée
import React from "react";
import { MOBILE_TABS } from "../../constants/doctorDashboard";

const MobileNav = ({ activeTab, handleTabChange, appointments = [] }) => {
  // Obtenir le prochain rendez-vous s'il y en a
  const nextAppointment = appointments.length > 0 
    ? appointments.find(apt => new Date(`${apt.date}T${apt.time}`) > new Date())
    : null;

  const NavItem = ({ tab }) => (
    <div
      className={`mobile-nav-item ${activeTab === tab.id ? "active" : ""}`}
      onClick={() => handleTabChange(tab.id)}
    >
      <i className={`fas fa-${tab.icon}`}></i>
      <span className="nav-label">{tab.label}</span>
    </div>
  );

  return (
    <nav className="mobile-nav">
      {MOBILE_TABS.map(tab => (
        <NavItem key={tab.id} tab={tab} />
      ))}
    </nav>
  );
};

export default MobileNav;