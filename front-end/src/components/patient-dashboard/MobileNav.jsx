// src/components/doctor-dashboard/MobileNav.jsx
import React from "react";

const MobileNav = ({ activeTab, handleTabChange }) => (
  <nav className="mobile-nav">
    <div
      className={`mobile-nav-item ${activeTab === "overview" ? "active" : ""}`}
      onClick={() => handleTabChange("overview")}
    >
      <i className="fas fa-home"></i>
    </div>
    <div
      className={`mobile-nav-item ${activeTab === "appointments" ? "active" : ""}`}
      onClick={() => handleTabChange("appointments")}
    >
      <i className="fas fa-calendar-alt"></i>
    </div>
    <div
      className={`mobile-nav-item ${activeTab === "patients" ? "active" : ""}`}
      onClick={() => handleTabChange("patients")}
    >
      <i className="fas fa-user-injured"></i>
    </div>
    <div
      className={`mobile-nav-item ${activeTab === "profile" ? "active" : ""}`}
      onClick={() => handleTabChange("profile")}
    >
      <i className="fas fa-user"></i>
    </div>
  </nav>
);

export default MobileNav;