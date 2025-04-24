// src/components/doctor-dashboard/DoctorNotificationList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../axios";

const DoctorNotificationList = ({ onClose, onCountUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setNotifications(response.data.notifications || []);
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };
  
  // Marquer une notification comme lue
  const handleMarkAsRead = async (id) => {
    try {
      const response = await axios.post(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
      
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count);
      }
    } catch (err) {
      console.error("Erreur lors du marquage de la notification:", err);
    }
  };
  
  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.post("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
      
      if (onCountUpdate) {
        onCountUpdate(0);
      }
    } catch (err) {
      console.error("Erreur lors du marquage de toutes les notifications:", err);
    }
  };
  
  // Supprimer une notification
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Empêcher le marquage comme lu en même temps
    
    try {
      const response = await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== id)
      );
      
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de la notification:", err);
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
  
  // Rendu du composant
  return (
    <div className="notifications-list">
      <div className="notifications-header">
        <h3>Notifications</h3>
        <div className="notifications-actions">
          <button 
            className="btn-sm btn-outline"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read_at) || notifications.length === 0}
          >
            <i className="fas fa-check-double"></i> Tout marquer comme lu
          </button>
          <button className="btn-icon" onClick={onClose} title="Fermer">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div className="notifications-body">
        {loading ? (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i> Chargement...
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <i className="fas fa-bell-slash"></i>
            <p>Aucune notification</p>
          </div>
        ) : (
          <ul className="notifications-items">
            {notifications.map(notification => (
              <li 
                key={notification.id} 
                className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="notification-icon">
                  <i className={`fas ${getIconClass(notification.type)}`}></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                    {!notification.read_at && <span className="unread-dot"></span>}
                  </div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatRelativeTime(notification.created_at)}</div>
                </div>
                <div className="notification-actions">
                  {notification.link && (
                    <Link 
                      to={notification.link} 
                      className="btn-icon" 
                      title="Voir plus de détails"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Link>
                  )}
                  <button 
                    className="btn-icon danger" 
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Supprimer"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="notifications-footer">
        <button className="btn-sm btn-outline" onClick={() => fetchNotifications()}>
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>
    </div>
  );
};

export default DoctorNotificationList;