// src/components/admin-dashboard/AdminNotificationList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../axios";

const AdminNotificationList = ({ onClose, onCountUpdate, systemStats }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("personal"); // "personal" ou "system"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Récupérer les notifications au chargement du composant
  useEffect(() => {
    if (viewMode === "personal") {
      fetchPersonalNotifications();
    } else {
      fetchSystemNotifications();
    }
  }, [viewMode]);
  
  // Fonction pour récupérer les notifications personnelles
  const fetchPersonalNotifications = async () => {
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
  
  // Fonction pour récupérer les notifications système (admin)
  const fetchSystemNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSystemNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications système:", err);
      setError("Impossible de charger les notifications système");
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
  
  // Créer une nouvelle notification (pour tous les utilisateurs d'un rôle)
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyFormData, setNotifyFormData] = useState({
    role: "patient",
    title: "",
    message: "",
    type: "info",
    link: ""
  });
  
  const handleNotifyFormChange = (e) => {
    const { name, value } = e.target;
    setNotifyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await axios.post("/api/notifications/notify-role", notifyFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Réinitialiser le formulaire
      setNotifyFormData({
        role: "patient",
        title: "",
        message: "",
        type: "info",
        link: ""
      });
      
      // Cacher le formulaire
      setShowNotifyForm(false);
      
      // Afficher un message de succès
      alert("Notifications envoyées avec succès");
      
      // Rafraîchir les données
      fetchSystemNotifications();
    } catch (err) {
      console.error("Erreur lors de l'envoi des notifications:", err);
      alert("Erreur lors de l'envoi des notifications: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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
  
  // Rendu du composant
  return (
    <div className="notifications-list admin-notifications-list">
      <div className="notifications-header">
        <h3>Notifications</h3>
        <div className="notifications-actions">
          <div className="view-selector">
            <button 
              className={`btn-sm ${viewMode === "personal" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewMode("personal")}
            >
              <i className="fas fa-user"></i> Personnelles
            </button>
            <button 
              className={`btn-sm ${viewMode === "system" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewMode("system")}
            >
              <i className="fas fa-server"></i> Système
            </button>
          </div>
          <button className="btn-icon" onClick={onClose} title="Fermer">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      {viewMode === "personal" ? (
        // Vue des notifications personnelles
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-outline"
              onClick={handleMarkAllAsRead}
              disabled={notifications.every(n => n.read_at) || notifications.length === 0 || loading}
            >
              <i className="fas fa-check-double"></i> Tout marquer comme lu
            </button>
          </div>
          
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
      ) : (
        // Vue des notifications système (admin)
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-primary"
              onClick={() => setShowNotifyForm(!showNotifyForm)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i> Nouvelle notification
            </button>
            
            {/* Aperçu des statistiques */}
            {systemStats && (
              <div className="system-stats">
                <div className="stats-item">
                  <span className="stats-label">Total:</span>
                  <span className="stats-value">{systemStats.total}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Non lues:</span>
                  <span className="stats-value">{systemStats.unread}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Aujourd'hui:</span>
                  <span className="stats-value">{systemStats.today}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Formulaire pour envoyer des notifications à un rôle */}
          {showNotifyForm && (
            <div className="notify-form">
              <h4>Envoyer une notification</h4>
              <form onSubmit={handleNotifySubmit}>
                <div className="form-group">
                  <label htmlFor="role">Destinataires</label>
                  <select 
                    id="role" 
                    name="role" 
                    value={notifyFormData.role}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                  >
                    <option value="patient">Tous les patients</option>
                    <option value="doctor">Tous les médecins</option>
                    <option value="admin">Tous les administrateurs</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="title">Titre</label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title"
                    value={notifyFormData.title}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                    placeholder="Titre de la notification"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    value={notifyFormData.message}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                    placeholder="Contenu du message"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <select 
                    id="type" 
                    name="type" 
                    value={notifyFormData.type}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                  >
                    <option value="info">Information</option>
                    <option value="success">Succès</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                    <option value="appointment">Rendez-vous</option>
                    <option value="medical">Dossier médical</option>
                    <option value="prescription">Ordonnance</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="link">Lien (optionnel)</label>
                  <input 
                    type="text" 
                    id="link" 
                    name="link"
                    value={notifyFormData.link}
                    onChange={handleNotifyFormChange}
                    disabled={loading}
                    placeholder="URL de redirection (optionnel)"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>} Envoyer
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowNotifyForm(false)}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loading ? (
            <div className="loading-indicator">
              <i className="fas fa-spinner fa-spin"></i> Chargement...
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          ) : systemNotifications.length === 0 ? (
            <div className="empty-notifications">
              <i className="fas fa-server"></i>
              <p>Aucune notification système à afficher</p>
            </div>
          ) : (
            <ul className="notifications-items system-notifications">
              {systemNotifications.map(notification => (
                <li 
                  key={notification.id} 
                  className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
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
                    <div className="notification-meta">
                      <div className="notification-recipient">
                        Destinataire: <span className="recipient-name">{notification.user?.name || "Inconnu"}</span>
                        {notification.user && getRoleBadge(notification.user.role)}
                      </div>
                      <div className="notification-time">{formatRelativeTime(notification.created_at)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="notifications-footer">
        {viewMode === "personal" ? (
          <button 
            className="btn-sm btn-outline" 
            onClick={fetchPersonalNotifications}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Actualiser
          </button>
        ) : (
          <button 
            className="btn-sm btn-outline" 
            onClick={fetchSystemNotifications}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Actualiser
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationList;