import React from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_TABS } from "../../constants/adminDashboard";

const AdminSidebar = ({
  user,
  activeTab,
  handleTabChange,
  handleLogout,
  actionLoading,
  profile
}) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="user-info">
        <div className="avatar">
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
        <span className="badge-admin">Administrateur</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {ADMIN_TABS.map((item) => (
            <li key={item.id} className={activeTab === item.id ? "active" : ""}>
              <button
                onClick={() => handleTabChange(item.id)}
                data-tab={item.id}
                disabled={actionLoading}
              >
                <i className={`fas fa-${item.icon}`}></i> {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer"></div>
    </aside>
  );
};

export default AdminSidebar;