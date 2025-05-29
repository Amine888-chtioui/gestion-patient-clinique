// src/components/admin-dashboard/AdminNotificationButton.jsx - CORRIGÉ
import React, { useState, useEffect, useRef } from "react";
import axios from "../../axios";

const AdminNotificationButton = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // NOUVEAU: États pour l'envoi de notifications
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sendFormData, setSendFormData] = useState({
    recipient_type: 'individual', // individual, all_doctors, all_patients, all_users
    user_id: '',
    title: '',
    message: '',
    type: 'info',
    link: ''
  });
  
  // NOUVEAU: État pour contrôler l'auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  // Fonction pour récupérer les notifications (MODIFIÉE)
  const fetchNotifications = async (silent = false) => {
    // NOUVEAU: Ne pas faire de requête si l'auto-refresh est désactivé
    if (!autoRefreshEnabled && !silent) {
      return;
    }

    try {
      if (!silent) setLoading(true);
      
      // MODIFIÉ: Récupérer toutes les notifications (lues et non lues) pour l'admin
      const response = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const notifs = response.data.notifications || [];
      setNotifications(notifs.slice(0, 10)); // Limiter à 10 notifications
      
      // Compter les non lues
      const unreadNotifs = notifs.filter(n => !n.read_at);
      setUnreadCount(unreadNotifs.length);
      setLastFetchTime(Date.now());
      
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // NOUVEAU: Récupérer la liste des utilisateurs pour l'envoi
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

  // NOUVEAU: Fonction pour désactiver temporairement l'auto-refresh
  const pauseAutoRefresh = (duration = 30000) => { // 30 secondes par défaut
    setAutoRefreshEnabled(false);
    setTimeout(() => {
      setAutoRefreshEnabled(true);
    }, duration);
  };

  // NOUVEAU: Fonction pour forcer un refresh manuel
  const forceRefresh = () => {
    setAutoRefreshEnabled(true);
    fetchNotifications();
  };

  // Chargement initial et configuration de l'intervalle
  useEffect(() => {
    fetchNotifications();
    fetchUsers(); // NOUVEAU: Charger les utilisateurs
    
    // MODIFIÉ: Intervalle conditionnel
    intervalRef.current = setInterval(() => {
      if (autoRefreshEnabled && !selectedNotification && !showSendForm) {
        fetchNotifications(true); // Fetch silencieux en arrière-plan
      }
    }, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, selectedNotification, showSendForm]);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedNotification(null);
        setShowSendForm(false); // NOUVEAU
        // NOUVEAU: Réactiver l'auto-refresh quand on ferme
        if (!autoRefreshEnabled) {
          setAutoRefreshEnabled(true);
        }
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [autoRefreshEnabled]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // Réduire le compteur
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  // MODIFIÉ: Afficher les détails d'une notification
  const showNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    
    // NOUVEAU: Désactiver l'auto-refresh pendant la consultation
    pauseAutoRefresh(60000); // 1 minute
    
    // Marquer comme lue si pas encore lu
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  // NOUVEAU: Retourner à la liste
  const backToList = () => {
    setSelectedNotification(null);
    setShowSendForm(false);
    setAutoRefreshEnabled(true);
  };

  // NOUVEAU: Ouvrir le formulaire d'envoi
  const openSendForm = () => {
    setShowSendForm(true);
    setSelectedNotification(null);
    pauseAutoRefresh(120000); // 2 minutes pour rédiger
    
    // Réinitialiser le formulaire
    setSendFormData({
      recipient_type: 'individual',
      user_id: '',
      title: '',
      message: '',
      type: 'info',
      link: ''
    });
  };

  // NOUVEAU: Gérer les changements du formulaire d'envoi
  const handleSendFormChange = (e) => {
    const { name, value } = e.target;
    setSendFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NOUVEAU: Envoyer une notification
  const sendNotification = async (e) => {
    e.preventDefault();
    
    if (!sendFormData.title.trim() || !sendFormData.message.trim()) {
      alert("Le titre et le message sont obligatoires");
      return;
    }

    setSendLoading(true);
    
    try {
      let endpoint = "/api/notifications/create";
      let payload = { ...sendFormData };

      // Déterminer l'endpoint selon le type de destinataire
      if (sendFormData.recipient_type === 'all_doctors') {
        endpoint = "/api/notifications/notify-role";
        payload = {
          role: 'doctor',
          title: sendFormData.title,
          message: sendFormData.message,
          type: sendFormData.type,
          link: sendFormData.link
        };
      } else if (sendFormData.recipient_type === 'all_patients') {
        endpoint = "/api/notifications/notify-role";
        payload = {
          role: 'patient',
          title: sendFormData.title,
          message: sendFormData.message,
          type: sendFormData.type,
          link: sendFormData.link
        };
      } else if (sendFormData.recipient_type === 'all_users') {
        // Envoyer à tous les rôles un par un
        const roles = ['doctor', 'patient'];
        for (const role of roles) {
          await axios.post("/api/notifications/notify-role", {
            role: role,
            title: sendFormData.title,
            message: sendFormData.message,
            type: sendFormData.type,
            link: sendFormData.link
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
        }
        
        // Fermer le formulaire et actualiser
        setShowSendForm(false);
        setAutoRefreshEnabled(true);
        fetchNotifications();
        alert("Notification envoyée à tous les utilisateurs !");
        return;
      }

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      // Fermer le formulaire et actualiser
      setShowSendForm(false);
      setAutoRefreshEnabled(true);
      fetchNotifications();
      
      // Message de succès selon le type
      let successMessage = "Notification envoyée !";
      if (sendFormData.recipient_type === 'all_doctors') {
        successMessage = "Notification envoyée à tous les médecins !";
      } else if (sendFormData.recipient_type === 'all_patients') {
        successMessage = "Notification envoyée à tous les patients !";
      } else if (sendFormData.recipient_type === 'individual') {
        const user = users.find(u => u.id === parseInt(sendFormData.user_id));
        successMessage = `Notification envoyée à ${user?.name || 'l\'utilisateur'} !`;
      }
      
      alert(successMessage);
      
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification:", err);
      alert("Erreur lors de l'envoi de la notification");
    } finally {
      setSendLoading(false);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await axios.post("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read_at: notif.read_at || new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      console.error("Erreur lors du marquage de toutes les notifications:", err);
    }
  };

  // Formater le temps relatif
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  // Obtenir la classe d'icône selon le type
  const getNotificationIcon = (type) => {
    const icons = {
      'success': 'fa-check-circle text-success',
      'warning': 'fa-exclamation-triangle text-warning',
      'error': 'fa-times-circle text-danger',
      'info': 'fa-info-circle text-info',
      'appointment': 'fa-calendar-check text-primary',
      'medical': 'fa-file-medical text-info',
      'prescription': 'fa-prescription text-primary',
      'patient': 'fa-user-injured text-info'
    };
    return icons[type] || 'fa-bell text-primary';
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button
        className="notification-button"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          {showSendForm ? (
            // NOUVEAU: Formulaire d'envoi de notification
            <div className="send-notification-form">
              <div className="notification-detail-header">
                <button 
                  className="back-button"
                  onClick={backToList}
                  title="Retour à la liste"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4>Envoyer une notification</h4>
              </div>
              
              <form onSubmit={sendNotification} className="send-form">
                <div className="form-group">
                  <label htmlFor="recipient_type">Destinataire :</label>
                  <select
                    id="recipient_type"
                    name="recipient_type"
                    value={sendFormData.recipient_type}
                    onChange={handleSendFormChange}
                    className="form-control"
                    disabled={sendLoading}
                  >
                    <option value="individual">Utilisateur spécifique</option>
                    <option value="all_doctors">Tous les médecins</option>
                    <option value="all_patients">Tous les patients</option>
                    <option value="all_users">Tous les utilisateurs</option>
                  </select>
                </div>

                {sendFormData.recipient_type === 'individual' && (
                  <div className="form-group">
                    <label htmlFor="user_id">Utilisateur :</label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={sendFormData.user_id}
                      onChange={handleSendFormChange}
                      className="form-control"
                      required
                      disabled={sendLoading}
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="type">Type :</label>
                  <select
                    id="type"
                    name="type"
                    value={sendFormData.type}
                    onChange={handleSendFormChange}
                    className="form-control"
                    disabled={sendLoading}
                  >
                    <option value="info">Information</option>
                    <option value="success">Succès</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                    <option value="appointment">Rendez-vous</option>
                    <option value="medical">Médical</option>
                    <option value="prescription">Ordonnance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Titre :</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={sendFormData.title}
                    onChange={handleSendFormChange}
                    className="form-control"
                    placeholder="Titre de la notification"
                    required
                    disabled={sendLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message :</label>
                  <textarea
                    id="message"
                    name="message"
                    value={sendFormData.message}
                    onChange={handleSendFormChange}
                    className="form-control"
                    placeholder="Contenu du message"
                    rows="3"
                    required
                    disabled={sendLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="link">Lien (optionnel) :</label>
                  <input
                    type="text"
                    id="link"
                    name="link"
                    value={sendFormData.link}
                    onChange={handleSendFormChange}
                    className="form-control"
                    placeholder="/admin/dashboard/patients"
                    disabled={sendLoading}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={sendLoading}
                  >
                    {sendLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Envoi...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Envoyer
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={backToList}
                    disabled={sendLoading}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          ) : selectedNotification ? (
            // NOUVEAU: Vue détaillée d'une notification
            <div className="notification-detail-view">
              <div className="notification-detail-header">
                <button 
                  className="back-button"
                  onClick={backToList}
                  title="Retour à la liste"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4>Détails de la notification</h4>
                {!autoRefreshEnabled && (
                  <span className="auto-refresh-status" title="Auto-refresh en pause">
                    <i className="fas fa-pause"></i>
                  </span>
                )}
              </div>
              
              <div className="notification-detail-content">
                <div className="detail-item">
                  <div className="detail-icon">
                    <i className={`fas ${getNotificationIcon(selectedNotification.type)}`}></i>
                  </div>
                  <div className="detail-text">
                    <h5>{selectedNotification.title}</h5>
                    <p>{selectedNotification.message}</p>
                    <small className="detail-time">
                      {formatRelativeTime(selectedNotification.created_at)}
                    </small>
                  </div>
                </div>
                
                {selectedNotification.link && (
                  <div className="detail-actions">
                    <a 
                      href={selectedNotification.link} 
                      className="detail-link"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="fas fa-external-link-alt"></i>
                      Voir plus de détails
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Vue liste normale
            <>
              <div className="notification-header">
                <h4>
                  Notifications 
                  {!autoRefreshEnabled && (
                    <span className="refresh-paused" title="Actualisation en pause">
                      <i className="fas fa-pause"></i>
                    </span>
                  )}
                </h4>
                <div className="header-actions">
                  {/* NOUVEAU: Bouton refresh manuel */}
                  <button 
                    className="refresh-button"
                    onClick={forceRefresh}
                    title="Actualiser maintenant"
                    disabled={loading}
                  >
                    <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                  </button>
                  
                  {/* NOUVEAU: Bouton envoyer notification */}
                  <button 
                    className="send-button"
                    onClick={openSendForm}
                    title="Envoyer une notification"
                    disabled={loading}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                  
                  {unreadCount > 0 && (
                    <button 
                      className="mark-all-read"
                      onClick={markAllAsRead}
                      title="Tout marquer comme lu"
                    >
                      <i className="fas fa-check-double"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="notifications-list">
                {loading && notifications.length === 0 ? (
                  <div className="notification-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Chargement...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="no-notifications">
                    <i className="fas fa-bell-slash"></i>
                    <span>Aucune notification</span>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
                      onClick={() => showNotificationDetails(notification)} // MODIFIÉ
                    >
                      <div className="notification-icon">
                        <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">
                          {notification.message.length > 80 
                            ? `${notification.message.substring(0, 80)}...`
                            : notification.message}
                        </div>
                        <div className="notification-time">
                          {formatRelativeTime(notification.created_at)}
                        </div>
                      </div>
                      {!notification.read_at && (
                        <div className="notification-unread-dot"></div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* NOUVEAU: Info sur l'état de l'auto-refresh */}
              <div className="notification-footer">
                <small className="last-update">
                  Dernière mise à jour: {formatRelativeTime(new Date(lastFetchTime))}
                  {!autoRefreshEnabled && " (en pause)"}
                </small>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .notification-container {
          position: relative;
        }

        .notification-button {
          background: none;
          border: none;
          color: #6c757d;
          font-size: 1.2rem;
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .notification-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #495057;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 350px;
          max-height: 500px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }

        .notification-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-paused {
          color: #ffc107;
          font-size: 0.8rem;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .refresh-button, .mark-all-read, .send-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .refresh-button:hover, .mark-all-read:hover, .send-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #495057;
        }

        .refresh-button:disabled, .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          color: #28a745;
        }

        .send-button:hover {
          color: #1e7e34;
        }

        .auto-refresh-status {
          color: #ffc107;
          margin-left: 8px;
        }

        .notifications-list {
          max-height: 350px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: background-color 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: rgba(13, 110, 253, 0.05);
          border-left: 3px solid #0d6efd;
        }

        .notification-icon {
          margin-right: 12px;
          font-size: 1.1rem;
          width: 20px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 500;
          color: #212529;
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .notification-message {
          color: #6c757d;
          font-size: 0.8rem;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .notification-time {
          color: #adb5bd;
          font-size: 0.7rem;
        }

        .notification-unread-dot {
          width: 8px;
          height: 8px;
          background-color: #0d6efd;
          border-radius: 50%;
          margin-left: 8px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .notification-loading, .no-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          color: #6c757d;
          gap: 8px;
        }

        .notification-footer {
          padding: 8px 16px;
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }

        .last-update {
          color: #6c757d;
          font-size: 0.7rem;
        }

        /* NOUVEAU: Styles pour la vue détaillée */
        .notification-detail-view {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .notification-detail-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
          gap: 12px;
        }

        .back-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #495057;
        }

        .notification-detail-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #495057;
          flex: 1;
        }

        .notification-detail-content {
          padding: 16px;
          flex: 1;
        }

        .detail-item {
          display: flex;
          gap: 12px;
        }

        .detail-icon {
          font-size: 1.5rem;
          width: 30px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-text h5 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: #212529;
        }

        .detail-text p {
          margin: 0 0 8px 0;
          color: #495057;
          line-height: 1.4;
        }

        .detail-time {
          color: #6c757d;
          font-size: 0.8rem;
        }

        .detail-actions {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #dee2e6;
        }

        .detail-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0d6efd;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .detail-link:hover {
          color: #0a58ca;
          text-decoration: underline;
        }

        /* NOUVEAU: Styles pour le formulaire d'envoi */
        .send-notification-form {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .send-form {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #495057;
        }

        .form-control {
          padding: 6px 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: #0d6efd;
          box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
        }

        .form-control:disabled {
          background-color: #f8f9fa;
          opacity: 0.8;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #dee2e6;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background-color: #0d6efd;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0b5ed7;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .notification-dropdown {
            width: 320px;
            right: -20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationButton;