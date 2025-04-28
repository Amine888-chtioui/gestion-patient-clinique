// src/components/admin-dashboard/AdminNotificationButton.jsx
import React, { useState, useEffect, useRef } from "react";
import AdminNotificationList from "./AdminNotificationList";
import axios from "../../axios";

const AdminNotificationButton = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemStats, setSystemStats] = useState(null);
  const notificationsPanelRef = useRef(null);
  
  // Récupérer le nombre de notifications non lues au chargement
  useEffect(() => {
    fetchUnreadCount();
    fetchSystemStats();
    
    // Configurer un intervalle pour vérifier périodiquement les nouvelles notifications
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showNotifications) {
        fetchSystemStats();
      }
    }, 60000); // Toutes les minutes
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(interval);
  }, [showNotifications]);
  
  // Ajouter un écouteur d'événements pour fermer le panneau de notifications lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Fonction pour récupérer le nombre de notifications non lues
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get("/api/notifications/unread", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications non lues:", err);
    }
  };

  // Fonction pour récupérer les statistiques système (admin uniquement)
  const fetchSystemStats = async () => {
    try {
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSystemStats(response.data.stats);
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques des notifications:", err);
    }
  };
  
  // Basculer l'affichage du panneau de notifications
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && !systemStats) {
      fetchSystemStats();
    }
  };
  
  // Fermer le panneau de notifications
  const closeNotifications = () => {
    setShowNotifications(false);
  };
  
  // Mettre à jour le compteur de notifications non lues
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };
  
  return (
    <div className="notification-container" ref={notificationsPanelRef}>
      <button 
        className="btn-secondary notification-btn" 
        onClick={toggleNotifications}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notifications-panel admin-notifications-panel">
          <AdminNotificationList 
            onClose={closeNotifications} 
            onCountUpdate={updateUnreadCount}
            systemStats={systemStats}
          />
        </div>
      )}
    </div>
  );
};

export default AdminNotificationButton;