import React, { useState } from "react";
import { MOBILE_ADMIN_TABS, MOBILE_MORE_TABS } from "../../constants/adminDashboard";

const MobileNav = ({ activeTab, handleTabChange }) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  // Gérer le clic sur un onglet
  const handleTabClick = (tabId) => {
    if (tabId === "more") {
      setMoreMenuOpen(!moreMenuOpen);
    } else {
      handleTabChange(tabId);
      setMoreMenuOpen(false);
    }
  };
  
  return (
    <>
      <nav className="mobile-nav">
        {MOBILE_ADMIN_TABS.map((tab) => (
          <div
            key={tab.id}
            className={`mobile-nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <i className={`fas fa-${tab.icon}`}></i>
            <span className="mobile-nav-label">{tab.label}</span>
          </div>
        ))}
        
        {/* Menu "Plus" */}
        <div
          className={`mobile-nav-item ${moreMenuOpen ? "active" : ""}`}
          onClick={() => handleTabClick("more")}
        >
          <i className="fas fa-ellipsis-h"></i>
          <span className="mobile-nav-label">Plus</span>
        </div>
      </nav>
      
      {/* Menu déroulant "Plus" */}
      {moreMenuOpen && (
        <div className="mobile-more-menu">
          {MOBILE_MORE_TABS.map((tab) => (
            <div
              key={tab.id}
              className={`mobile-more-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <i className={`fas fa-${tab.icon}`}></i>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Overlay pour fermer le menu */}
      {moreMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMoreMenuOpen(false)}></div>
      )}
    </>
  );
};

export default MobileNav;