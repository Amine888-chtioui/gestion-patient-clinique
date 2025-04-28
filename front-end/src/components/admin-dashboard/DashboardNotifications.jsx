// src/components/admin-dashboard/DashboardNotifications.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { Link } from "react-router-dom";

const DashboardNotifications = ({ handleTabChange }) => {
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    by_type: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Limiter à 5 notifications
      setRecentNotifications(response.data.notifications.slice(0, 5));
      setStats(response.data.stats);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError("Impossible de charger les données des notifications");
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir la classe d'icône en fonction du type de notification
  const getIconClass = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle text-success';
      case 'warning':
        return 'fa-exclamation-triangle text-warning';
      case 'error':
        return 'fa-times-circle text-danger';
      case 'appointment':
        return 'fa-calendar-check text-primary';
      case 'medical':
        return 'fa-file-medical text-info';
      case 'prescription':
        return 'fa-prescription text-primary';
      case 'patient':
        return 'fa-user-injured text-info';
      default:
        return 'fa-bell text-primary';
    }
  };
  
  // Formater la date relative (il y a X minutes, heures, etc.)
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "à l'instant";
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `il y a ${diffInMonths} mois`;
  };
  
  // Obtenir le badge du rôle
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="role-badge admin">Admin</span>;
      case 'doctor':
        return <span className="role-badge doctor">Médecin</span>;
      case 'patient':
        return <span className="role-badge patient">Patient</span>;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-notifications">
      <div className="card-header">
        <h3><i className="fas fa-bell"></i> Notifications récentes</h3>
        <div className="header-actions">
          <button className="btn-sm btn-outline" onClick={fetchData} disabled={loading}>
            <i className="fas fa-sync-alt"></i> Actualiser
          </button>
        </div>
      </div>
      
      <div className="notification-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        
        <div className="stat-item highlight">
          <div className="stat-icon">
            <i className="fas fa-bell-slash"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.unread}</div>
            <div className="stat-label">Non lues</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">Aujourd'hui</div>
          </div>
        </div>
      </div>
      
      <div className="notifications-preview">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i> Chargement des notifications...
          </div>
        ) : error ? (
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <p>Aucune notification récente</p>
          </div>
        ) : (
          <ul className="notification-list">
            {recentNotifications.map(notification => (
              <li key={notification.id} className={`notification-item ${!notification.read_at ? 'unread' : ''}`}>
                <div className="notification-icon">
                  <i className={`fas ${getIconClass(notification.type)}`}></i>
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-time">{formatRelativeTime(notification.created_at)}</div>
                  </div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-meta">
                    Destinataire: <span className="recipient-name">{notification.user?.name || "Inconnu"}</span>
                    {notification.user && getRoleBadge(notification.user.role)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="card-footer">
        <button className="btn-primary" onClick={() => handleTabChange("notifications")}>
          Voir toutes les notifications <i className="fas fa-arrow-right"></i>
        </button>
        
        <button className="btn-outline" onClick={() => handleTabChange("notifications", "create")}>
          <i className="fas fa-plus"></i> Créer une notification
        </button>
      </div>
    </div>
  );
};

export default DashboardNotifications;