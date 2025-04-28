// src/components/admin-dashboard/NotificationsManagement.jsx
import React, { useState, useEffect } from "react";
import axios from "../../axios";
import "./admin-notification.css";
import "./notifications-management.css";

const NotificationsManagement = ({ actionLoading, setActionLoading, setActionError, setActionSuccess }) => {
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("all"); // "all", "unread", "today"
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    by_type: {}
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // État pour le formulaire de création
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    message: "",
    type: "info",
    link: ""
  });

  // Récupérer les notifications et les statistiques
  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [viewMode, typeFilter, roleFilter]);

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Récupérer les notifications système pour l'admin
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Filtrer les notifications selon les critères
      let filteredNotifications = response.data.notifications || [];
      
      // Filtrer par mode de vue
      if (viewMode === "unread") {
        filteredNotifications = filteredNotifications.filter(notif => !notif.read_at);
      } else if (viewMode === "today") {
        const today = new Date().toISOString().split('T')[0];
        filteredNotifications = filteredNotifications.filter(
          notif => notif.created_at.startsWith(today)
        );
      }
      
      // Filtrer par type de notification
      if (typeFilter !== "all") {
        filteredNotifications = filteredNotifications.filter(notif => notif.type === typeFilter);
      }
      
      // Filtrer par rôle d'utilisateur
      if (roleFilter !== "all") {
        filteredNotifications = filteredNotifications.filter(
          notif => notif.user && notif.user.role === roleFilter
        );
      }
      
      // Filtrer par terme de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredNotifications = filteredNotifications.filter(
          notif => 
            notif.title.toLowerCase().includes(term) || 
            notif.message.toLowerCase().includes(term) ||
            (notif.user && notif.user.name.toLowerCase().includes(term))
        );
      }
      
      setNotifications(filteredNotifications);
      setStats(response.data.stats || {
        total: 0,
        unread: 0,
        today: 0,
        by_type: {}
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setActionError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    }
  };

  // Fonction pour récupérer les notifications d'un utilisateur spécifique
  const fetchUserNotifications = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSelectedUser(response.data.user);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications de l'utilisateur:", err);
      setActionError("Impossible de charger les notifications de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle notification
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      
      // Valider les données
      if (!formData.title.trim() || !formData.message.trim()) {
        setActionError("Le titre et le message sont requis");
        return;
      }
      
      // Préparer la requête
      let requestData = { ...formData };
      let endpoint = "/api/notifications/create";
      
      // Si c'est une notification pour tous les utilisateurs d'un rôle
      if (formData.user_id === "role_patient" || formData.user_id === "role_doctor" || formData.user_id === "role_admin") {
        endpoint = "/api/notifications/notify-role";
        requestData = {
          role: formData.user_id.replace("role_", ""),
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link
        };
      }
      
      // Envoyer la requête
      await axios.post(endpoint, requestData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Réinitialiser le formulaire
      setFormData({
        user_id: "",
        title: "",
        message: "",
        type: "info",
        link: ""
      });
      
      setShowCreateForm(false);
      setActionSuccess("Notification envoyée avec succès");
      
      // Recharger les notifications
      fetchNotifications();
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification:", err);
      setActionError("Erreur lors de l'envoi de la notification: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }
    
    try {
      setActionLoading(true);
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour la liste
      setNotifications(notifications.filter(notif => notif.id !== id));
      setActionSuccess("Notification supprimée avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression de la notification:", err);
      setActionError("Erreur lors de la suppression: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Afficher les détails d'une notification
  const viewNotificationDetails = (notification) => {
    setSelectedNotification(notification);
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

  // Formater la date complète
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="notifications-management">
      <div className="management-header">
        <h2>
          {selectedUser ? (
            <>
              Notifications de {selectedUser.name} {getRoleBadge(selectedUser.role)}
              <button 
                className="btn-link" 
                onClick={() => { setSelectedUser(null); fetchNotifications(); }}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
            </>
          ) : "Gestion des notifications"}
        </h2>
        
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={actionLoading}
          >
            <i className="fas fa-plus"></i> Créer une notification
          </button>
        </div>
      </div>
      
      {/* Formulaire de création de notification */}
      {showCreateForm && (
        <div className="create-notification-form">
          <div className="form-header">
            <h3>Créer une notification</h3>
            <button 
              className="btn-icon" 
              onClick={() => setShowCreateForm(false)}
              disabled={actionLoading}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleCreateNotification}>
            <div className="form-group">
              <label htmlFor="user_id">Destinataire *</label>
              <select 
                id="user_id" 
                name="user_id" 
                value={formData.user_id}
                onChange={handleFormChange}
                required
                disabled={actionLoading}
                className="form-control"
              >
                <option value="">Sélectionner un destinataire</option>
                <optgroup label="Groupes d'utilisateurs">
                  <option value="role_patient">Tous les patients</option>
                  <option value="role_doctor">Tous les médecins</option>
                  <option value="role_admin">Tous les administrateurs</option>
                </optgroup>
                <optgroup label="Utilisateurs individuels">
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">Titre *</label>
              <input 
                type="text" 
                id="title" 
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                disabled={actionLoading}
                className="form-control"
                placeholder="Titre de la notification"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea 
                id="message" 
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                required
                disabled={actionLoading}
                className="form-control"
                placeholder="Contenu du message"
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select 
                id="type" 
                name="type" 
                value={formData.type}
                onChange={handleFormChange}
                required
                disabled={actionLoading}
                className="form-control"
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
                value={formData.link}
                onChange={handleFormChange}
                disabled={actionLoading}
                className="form-control"
                placeholder="URL de redirection (optionnel)"
              />
              <small className="form-text">
                Exemple: /admin/dashboard?tab=patients pour rediriger vers la page des patients
              </small>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Envoi en cours...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Envoyer la notification</>
                )}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={actionLoading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Modal de détails de notification */}
      {selectedNotification && (
        <div className="notification-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails de la notification</h3>
              <button 
                className="btn-icon" 
                onClick={() => setSelectedNotification(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="notification-detail-item">
                <div className="detail-label">Titre:</div>
                <div className="detail-value">{selectedNotification.title}</div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Message:</div>
                <div className="detail-value">{selectedNotification.message}</div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Type:</div>
                <div className="detail-value">
                  <i className={`fas ${getIconClass(selectedNotification.type)}`}></i> {selectedNotification.type}
                </div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Destinataire:</div>
                <div className="detail-value">
                  {selectedNotification.user ? (
                    <>
                      {selectedNotification.user.name} 
                      <span className="detail-secondary">({selectedNotification.user.email})</span>
                      {getRoleBadge(selectedNotification.user.role)}
                    </>
                  ) : "Utilisateur inconnu"}
                </div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Lien:</div>
                <div className="detail-value">
                  {selectedNotification.link ? (
                    <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer">
                      {selectedNotification.link}
                    </a>
                  ) : "Aucun lien"}
                </div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Statut:</div>
                <div className="detail-value">
                  {selectedNotification.read_at ? (
                    <span className="status read">
                      <i className="fas fa-check-circle"></i> Lue le {formatDate(selectedNotification.read_at)}
                    </span>
                  ) : (
                    <span className="status unread">
                      <i className="fas fa-clock"></i> Non lue
                    </span>
                  )}
                </div>
              </div>
              
              <div className="notification-detail-item">
                <div className="detail-label">Créée le:</div>
                <div className="detail-value">{formatDate(selectedNotification.created_at)}</div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-danger" 
                onClick={() => {
                  handleDeleteNotification(selectedNotification.id);
                  setSelectedNotification(null);
                }}
                disabled={actionLoading}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedNotification(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Si nous ne sommes pas en train de consulter les notifications d'un utilisateur spécifique */}
      {!selectedUser && (
        <div className="filters-bar">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher des notifications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn-clear-search" 
                onClick={() => setSearchTerm("")}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          <div className="filters-group">
            <div className="filter-item">
              <label>Afficher:</label>
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                className="form-control"
              >
                <option value="all">Toutes</option>
                <option value="unread">Non lues</option>
                <option value="today">Aujourd'hui</option>
              </select>
            </div>
            
            <div className="filter-item">
              <label>Type:</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">Tous</option>
                <option value="info">Information</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
                <option value="appointment">Rendez-vous</option>
                <option value="medical">Dossier médical</option>
                <option value="prescription">Ordonnance</option>
              </select>
            </div>
            
            <div className="filter-item">
              <label>Rôle:</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">Tous</option>
                <option value="patient">Patients</option>
                <option value="doctor">Médecins</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>
            
            <button 
              className="btn-secondary" 
              onClick={() => {
                setSearchTerm("");
                setViewMode("all");
                setTypeFilter("all");
                setRoleFilter("all");
              }}
              disabled={actionLoading || (searchTerm === "" && viewMode === "all" && typeFilter === "all" && roleFilter === "all")}
            >
              <i className="fas fa-sync-alt"></i> Réinitialiser
            </button>
          </div>
        </div>
      )}
      
      {/* Tableau des notifications */}
      <div className="notifications-table-container">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i> Chargement des notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <h3>Aucune notification</h3>
            <p>Aucune notification ne correspond à vos critères de recherche</p>
          </div>
        ) : (
          <table className="notifications-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Destinataire</th>
                <th>Type</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notification => (
                <tr 
                  key={notification.id} 
                  className={notification.read_at ? "" : "unread"}
                >
                  <td className="notification-title-cell">
                    <span 
                      className="notification-title"
                      onClick={() => viewNotificationDetails(notification)}
                    >
                      {notification.title}
                    </span>
                  </td>
                  <td>
                    {notification.user ? (
                      <div className="user-info">
                        <span className="user-name">{notification.user.name}</span>
                        {getRoleBadge(notification.user.role)}
                      </div>
                    ) : "Utilisateur inconnu"}
                  </td>
                  <td>
                    <span className="notification-type">
                      <i className={`fas ${getIconClass(notification.type)}`}></i>
                      {notification.type}
                    </span>
                  </td>
                  <td>
                    <div className="notification-date">
                      <span className="date-absolute">{new Date(notification.created_at).toLocaleDateString()}</span>
                      <span className="date-relative">{formatRelativeTime(notification.created_at)}</span>
                    </div>
                  </td>
                  <td>
                    {notification.read_at ? (
                      <span className="status read">
                        <i className="fas fa-check-circle"></i> Lue
                      </span>
                    ) : (
                      <span className="status unread">
                        <i className="fas fa-clock"></i> Non lue
                      </span>
                    )}
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon" 
                      title="Voir les détails"
                      onClick={() => viewNotificationDetails(notification)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {notification.user && (
                      <button 
                        className="btn-icon" 
                        title="Voir toutes les notifications de cet utilisateur"
                        onClick={() => fetchUserNotifications(notification.user.id)}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-user-check"></i>
                      </button>
                    )}
                    <button 
                      className="btn-icon danger" 
                      title="Supprimer"
                      onClick={() => handleDeleteNotification(notification.id)}
                      disabled={actionLoading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NotificationsManagement;