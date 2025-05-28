// src/components/admin-dashboard/AdminNotificationList.jsx - Version complète avec notifications personnelles améliorées
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "../../axios";

const AdminNotificationList = ({ onClose, onCountUpdate, systemStats }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // NOUVEAU: Référence pour le dernier count pour détecter les nouvelles notifications
  const lastCountRef = useRef(0);
  const lastNotificationIdsRef = useRef(new Set());
  
  useEffect(() => {
    // Initial fetch
    if (viewMode === "personal") {
      fetchPersonalNotifications();
    } else {
      fetchSystemNotifications();
    }
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Set up polling interval - RÉDUIT À 3 SECONDES pour les notifications critiques
    pollingIntervalRef.current = setInterval(() => {
      if (viewMode === "personal") {
        fetchPersonalNotifications();
      } else {
        fetchSystemNotifications();
      }
    }, 3000); // 3 secondes pour les notifications admin importantes
    
    // Clean up interval when component unmounts or viewMode changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [viewMode]);
  
  // Function to fetch personal notifications - AMÉLIORÉ
  const fetchPersonalNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const newNotifications = response.data.notifications || [];
      const newCount = response.data.unread_count || 0;
      
      // NOUVEAU: Détecter les nouvelles notifications par ID
      const currentNotificationIds = new Set(newNotifications.map(n => n.id));
      const hasNewNotifications = newNotifications.some(n => 
        !lastNotificationIdsRef.current.has(n.id) && !n.read_at
      );
      
      // Check if there are more unread notifications than before ET nouvelles notifications
      if ((newCount > lastCountRef.current || hasNewNotifications) && lastCountRef.current >= 0) {
        console.log("🔔 Nouvelles notifications administrateur détectées!", {
          previousCount: lastCountRef.current,
          newCount: newCount,
          hasNewNotifications,
          difference: newCount - lastCountRef.current
        });
        
        // NOUVEAU: Identifier les types de nouvelles notifications
        const newUnreadNotifications = newNotifications.filter(n => 
          !n.read_at && !lastNotificationIdsRef.current.has(n.id)
        );
        
        const hasPaymentNotification = newUnreadNotifications.some(n => 
          n.title?.toLowerCase().includes('paiement') || 
          n.title?.toLowerCase().includes('payée') ||
          n.title?.toLowerCase().includes('facture') && n.type === 'success'
        );
        
        const hasContactNotification = newUnreadNotifications.some(n => 
          n.title?.toLowerCase().includes('contact') ||
          n.title?.toLowerCase().includes('message')
        );
        
        // Jouer un son (optionnel) - son différent selon le type
        try {
          let soundFile = '/notification-sound.mp3'; // Son par défaut
          
          if (hasPaymentNotification) {
            soundFile = '/payment-notification.mp3'; // Son spécial pour les paiements
          } else if (hasContactNotification) {
            soundFile = '/contact-notification.mp3'; // Son spécial pour les contacts
          }
          
          const audio = new Audio(soundFile);
          audio.volume = 0.3; // Volume réduit
          audio.play().catch(e => {
            // Fallback au son par défaut si le son spécialisé n'existe pas
            if (soundFile !== '/notification-sound.mp3') {
              try {
                new Audio('/notification-sound.mp3').volume = 0.3;
                new Audio('/notification-sound.mp3').play().catch(() => {});
              } catch (fallbackError) {
                console.log('Fallback notification sound failed:', fallbackError);
              }
            }
          });
        } catch (soundError) {
          console.log('Could not play notification sound:', soundError);
        }
        
        // Effet visuel (flash) différent selon le type
        if (hasPaymentNotification) {
          document.body.classList.add('payment-notification-flash');
          setTimeout(() => {
            document.body.classList.remove('payment-notification-flash');
          }, 1500);
        } else if (hasContactNotification) {
          document.body.classList.add('contact-notification-flash');
          setTimeout(() => {
            document.body.classList.remove('contact-notification-flash');
          }, 1500);
        } else {
          document.body.classList.add('new-notification-flash');
          setTimeout(() => {
            document.body.classList.remove('new-notification-flash');
          }, 1000);
        }
        
        // NOUVEAU: Notification du navigateur si l'onglet n'est pas actif
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          let notificationTitle = 'Nouvelle notification admin';
          let notificationBody = `Vous avez ${newCount} notification${newCount > 1 ? 's' : ''} non lue${newCount > 1 ? 's' : ''}`;
          let notificationIcon = '/favicon.ico';
          
          if (hasPaymentNotification) {
            notificationTitle = '💰 Nouveau paiement reçu';
            notificationBody = 'Un paiement vient d\'être effectué par un patient';
            notificationIcon = '/payment-icon.png';
          } else if (hasContactNotification) {
            notificationTitle = '📧 Nouveau message de contact';
            notificationBody = 'Un nouveau message de contact a été reçu';
            notificationIcon = '/contact-icon.png';
          }
          
          const browserNotification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: notificationIcon,
            tag: 'admin-notification',
            requireInteraction: false,
            silent: false
          });
          
          // Auto-fermer après 5 secondes
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }
      }
      
      lastCountRef.current = newCount;
      lastNotificationIdsRef.current = currentNotificationIds;
      
      setNotifications(newNotifications);
      if (onCountUpdate) {
        onCountUpdate(newCount);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err.response?.data || err.message);
      setError("Impossible de charger les notifications. Veuillez réessayer plus tard.");
      setLoading(false);
    }
  };
  
  // Function to fetch system notifications
  const fetchSystemNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSystemNotifications(response.data.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching system notifications:", err.response?.data || err.message);
      setError("Impossible de charger les notifications système. Veuillez réessayer plus tard.");
      setLoading(false);
    }
  };
  
  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      const response = await axios.post(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
      
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.post("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
      
      if (onCountUpdate) {
        onCountUpdate(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };
  
  // Delete notification
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    try {
      const response = await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== id)
      );
      
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };
  
  // NOUVEAU: Fonction pour formater les notifications spéciales avec icônes et couleurs
  const formatSpecialNotification = (notification) => {
    const { type, title, message } = notification;
    const titleLower = title?.toLowerCase() || '';
    const messageLower = message?.toLowerCase() || '';
    
    // Notifications de paiement (priorité haute)
    if (titleLower.includes('paiement') || 
        titleLower.includes('payée') || 
        titleLower.includes('facture') && type === 'success' ||
        messageLower.includes('paiement') ||
        messageLower.includes('payée')) {
      return {
        ...notification,
        icon: 'fa-money-bill-wave',
        color: '#28a745',
        priority: 'high',
        category: 'payment',
        bgColor: 'rgba(40, 167, 69, 0.1)'
      };
    }
    
    // Notifications de contact (priorité moyenne-haute)
    if (titleLower.includes('contact') || 
        titleLower.includes('message') ||
        messageLower.includes('contact') ||
        messageLower.includes('message de')) {
      return {
        ...notification,
        icon: 'fa-envelope',
        color: '#17a2b8',
        priority: 'medium-high',
        category: 'contact',
        bgColor: 'rgba(23, 162, 184, 0.1)'
      };
    }
    
    // Notifications de rendez-vous (priorité moyenne)
    if (type === 'appointment' || 
        titleLower.includes('rendez-vous') ||
        titleLower.includes('appointment')) {
      return {
        ...notification,
        icon: 'fa-calendar-check',
        color: '#6a1b9a',
        priority: 'medium',
        category: 'appointment',
        bgColor: 'rgba(106, 27, 154, 0.1)'
      };
    }
    
    // Notifications médicales (priorité moyenne)
    if (type === 'medical' || 
        titleLower.includes('dossier') ||
        titleLower.includes('médical')) {
      return {
        ...notification,
        icon: 'fa-file-medical',
        color: '#fd7e14',
        priority: 'medium',
        category: 'medical',
        bgColor: 'rgba(253, 126, 20, 0.1)'
      };
    }
    
    // Notifications d'erreur (priorité haute)
    if (type === 'error' || titleLower.includes('erreur') || titleLower.includes('échec')) {
      return {
        ...notification,
        icon: 'fa-exclamation-triangle',
        color: '#dc3545',
        priority: 'high',
        category: 'error',
        bgColor: 'rgba(220, 53, 69, 0.1)'
      };
    }
    
    // Notifications de succès (priorité normale)
    if (type === 'success') {
      return {
        ...notification,
        icon: 'fa-check-circle',
        color: '#28a745',
        priority: 'normal',
        category: 'success',
        bgColor: 'rgba(40, 167, 69, 0.05)'
      };
    }
    
    return {
      ...notification,
      icon: 'fa-bell',
      color: '#6c757d',
      priority: 'normal',
      category: 'default',
      bgColor: 'transparent'
    };
  };
  
  // Create a new notification (for all users of a role)
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
      
      // Reset the form
      setNotifyFormData({
        role: "patient",
        title: "",
        message: "",
        type: "info",
        link: ""
      });
      
      // Hide the form
      setShowNotifyForm(false);
      
      // Display a success message
      alert("Notifications envoyées avec succès");
      
      // Refresh the data
      fetchSystemNotifications();
    } catch (err) {
      console.error("Error sending notifications:", err);
      alert("Erreur lors de l'envoi des notifications: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "à l'instant";
    
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
  
  // Get icon class based on notification type
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
  
  // Get role badge
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
  
  // NOUVEAU: Trier les notifications par priorité et date
  const sortNotificationsByPriority = (notifications) => {
    const priorityOrder = {
      'high': 1,
      'medium-high': 2,
      'medium': 3,
      'normal': 4
    };
    
    return [...notifications].sort((a, b) => {
      const aFormatted = formatSpecialNotification(a);
      const bFormatted = formatSpecialNotification(b);
      
      // D'abord par statut (non lues en premier)
      if (!a.read_at && b.read_at) return -1;
      if (a.read_at && !b.read_at) return 1;
      
      // Ensuite par priorité
      const aPriority = priorityOrder[aFormatted.priority] || 4;
      const bPriority = priorityOrder[bFormatted.priority] || 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Enfin par date (plus récentes en premier)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };
  
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
              <i className="fas fa-user"></i> Personnel
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
        // Personal notifications view - AMÉLIORÉ AVEC TRI ET CATÉGORIES
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-outline"
              onClick={handleMarkAllAsRead}
              disabled={notifications.every(n => n.read_at) || notifications.length === 0 || loading}
            >
              <i className="fas fa-check-double"></i> Marquer tout comme lu
            </button>
            
            {/* NOUVEAU: Affichage des stats personnelles améliorées */}
            <div className="personal-stats">
              <div className="stat-item">
                <i className="fas fa-bell"></i>
                <span>{notifications.filter(n => !n.read_at).length} non lues</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-calendar-day"></i>
                <span>{notifications.filter(n => n.created_at && new Date(n.created_at).toDateString() === new Date().toDateString()).length} aujourd'hui</span>
              </div>
            </div>
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
              <small>Les nouvelles notifications apparaîtront ici</small>
            </div>
          ) : (
            <ul className="notifications-items">
              {sortNotificationsByPriority(notifications).map(notification => {
                const formattedNotif = formatSpecialNotification(notification);
                return (
                  <li 
                    key={notification.id} 
                    className={`notification-item ${!notification.read_at ? 'unread' : ''} ${formattedNotif.category}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{
                      borderLeftColor: formattedNotif.color,
                      backgroundColor: !notification.read_at ? formattedNotif.bgColor : 'transparent'
                    }}
                  >
                    <div className="notification-icon" style={{ backgroundColor: formattedNotif.bgColor }}>
                      <i className={`fas ${formattedNotif.icon}`} 
                         style={{ color: formattedNotif.color }}></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.read_at && <span className="unread-dot" style={{ backgroundColor: formattedNotif.color }}></span>}
                        {formattedNotif.priority === 'high' && (
                          <span className="priority-badge high">
                            <i className="fas fa-exclamation"></i>
                          </span>
                        )}
                      </div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formattedNotif.category === 'payment' && <i className="fas fa-coins" style={{ color: formattedNotif.color, marginRight: '4px' }}></i>}
                        {formattedNotif.category === 'contact' && <i className="fas fa-envelope" style={{ color: formattedNotif.color, marginRight: '4px' }}></i>}
                        {formatRelativeTime(notification.created_at)}
                      </div>
                    </div>
                    <div className="notification-actions">
                      {notification.link && (
                        <Link 
                          to={notification.link} 
                          className="btn-icon" 
                          title="Voir les détails"
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
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        // System notifications view (admin) - INCHANGÉ
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-primary"
              onClick={() => setShowNotifyForm(!showNotifyForm)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i> Nouvelle notification
            </button>
            
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
          
          {/* Form to send notifications to a role */}
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
      
      {/* NOUVEAU: Styles CSS pour les notifications spéciales et améliorations */}
      <style jsx>{`
        /* === NOTIFICATIONS SPÉCIALES === */
        .notification-item.payment {
          border-left: 3px solid #28a745;
        }
        
        .notification-item.contact {
          border-left: 3px solid #17a2b8;
        }
        
        .notification-item.appointment {
          border-left: 3px solid #6a1b9a;
        }
        
        .notification-item.medical {
          border-left: 3px solid #fd7e14;
        }
        
        .notification-item.error {
          border-left: 3px solid #dc3545;
        }
        
        /* === STATS PERSONNELLES AMÉLIORÉES === */
        .personal-stats {
          display: flex;
          gap: 15px;
          margin-left: auto;
          padding: 6px 12px;
          background-color: rgba(108, 117, 125, 0.1);
          border-radius: 12px;
          font-size: 0.75rem;
          color: #6c757d;
        }
        
        .personal-stats .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .personal-stats .stat-item i {
          font-size: 0.7rem;
          color: #6a1b9a;
        }
        
        .notifications-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        
        /* === ANIMATIONS POUR NOUVELLES NOTIFICATIONS === */
        .new-notification-flash {
          animation: flashNotification 1s ease-in-out;
        }
        
        .payment-notification-flash {
          animation: flashPayment 1.5s ease-in-out;
        }
        
        .contact-notification-flash {
          animation: flashContact 1.5s ease-in-out;
        }
        
        @keyframes flashNotification {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(108, 117, 125, 0.1); }
        }
        
        @keyframes flashPayment {
          0%, 100% { background-color: transparent; }
          50% { 
            background-color: rgba(40, 167, 69, 0.15);
            box-shadow: inset 0 0 20px rgba(40, 167, 69, 0.2);
          }
        }
        
        @keyframes flashContact {
          0%, 100% { background-color: transparent; }
          50% { 
            background-color: rgba(23, 162, 184, 0.15);
            box-shadow: inset 0 0 20px rgba(23, 162, 184, 0.2);
          }
        }
        
        /* === STYLE POUR LES NOTIFICATIONS NON LUES IMPORTANTES === */
        .notification-item.unread.payment,
        .notification-item.unread.contact,
        .notification-item.unread.error {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        
        /* === AMÉLIORATION DE L'ICÔNE DE NOTIFICATION === */
        .notification-icon {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .notification-item.unread .notification-icon::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #dc3545;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        /* === BADGE DE PRIORITÉ === */
        .priority-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          font-size: 0.6rem;
          margin-left: 6px;
        }
        
        .priority-badge.high {
          background-color: #dc3545;
          color: white;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
        
        /* === NOTIFICATION VIDE AMÉLIORÉE === */
        .empty-notifications {
          text-align: center;
          padding: 30px 20px;
          color: #6c757d;
        }
        
        .empty-notifications i {
          font-size: 2.5rem;
          margin-bottom: 15px;
          color: #dee2e6;
        }
        
        .empty-notifications p {
          font-size: 1.1rem;
          margin-bottom: 5px;
          color: #495057;
        }
        
        .empty-notifications small {
          font-size: 0.9rem;
          color: #6c757d;
        }
        
        /* === AMÉLIORATIONS RESPONSIVES === */
        @media (max-width: 768px) {
          .personal-stats {
            flex-direction: column;
            gap: 5px;
            font-size: 0.7rem;
          }
          
          .notifications-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .notification-item {
            padding: 10px;
            gap: 10px;
          }
          
          .notification-icon {
            width: 32px;
            height: 32px;
          }
          
          .notification-title {
            font-size: 0.85rem;
          }
          
          .notification-message {
            font-size: 0.8rem;
            -webkit-line-clamp: 3;
          }
        }
        
        /* === ANIMATIONS DE CHARGEMENT === */
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
          color: #6c757d;
          gap: 10px;
        }
        
        .loading-indicator i {
          font-size: 1.2rem;
        }
        
        /* === MESSAGES D'ERREUR === */
        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #dc3545;
          background-color: rgba(220, 53, 69, 0.1);
          border-radius: 8px;
          margin: 10px 0;
          gap: 8px;
        }
        
        /* === AMÉLIORATION DES ACTIONS === */
        .notification-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .notification-item:hover .notification-actions {
          opacity: 1;
        }
        
        .notification-actions .btn-icon {
          padding: 4px;
          font-size: 0.75rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .notification-actions .btn-icon:hover {
          transform: scale(1.1);
        }
        
        /* === AMÉLIORATIONS GLOBALES === */
        .notifications-list.admin-notifications-list {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }
        
        .notifications-header {
          background: linear-gradient(135deg, #6a1b9a, #8e24aa);
          color: white;
          padding: 15px 20px;
        }
        
        .notifications-body {
          max-height: 400px;
          overflow-y: auto;
          padding: 15px;
        }
        
        .notifications-footer {
          padding: 12px 20px;
          border-top: 1px solid #e9ecef;
          background-color: #f8f9fa;
        }
        
        /* === SCROLLBAR PERSONNALISÉE === */
        .notifications-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .notifications-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .notifications-body::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .notifications-body::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationList;