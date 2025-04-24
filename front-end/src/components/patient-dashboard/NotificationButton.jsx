// src/components/patient-dashboard/NotificationButton.jsx
import React, { useState, useEffect, useRef } from "react";
import NotificationList from "./NotificationList";
import axios from "../../axios";

const NotificationButton = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsPanelRef = useRef(null);
  
  // Récupérer le nombre de notifications non lues au chargement
  useEffect(() => {
    fetchUnreadCount();
    
    // Configurer un intervalle pour vérifier périodiquement les nouvelles notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Toutes les minutes
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(interval);
  }, []);
  
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
  
  // Basculer l'affichage du panneau de notifications
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
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
        <div className="notifications-panel">
          <NotificationList 
            onClose={closeNotifications} 
            onCountUpdate={updateUnreadCount} 
          />
        </div>
      )}
    </div>
  );
};

export default NotificationButton;