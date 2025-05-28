// src/components/admin-dashboard/AdminNotificationButton.jsx - Amélioration pour les notifications personnelles
import React, { useState, useEffect, useRef } from "react";
import AdminNotificationList from "./AdminNotificationList";
import axios from "../../axios";

const AdminNotificationButton = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [lastNotificationTypes, setLastNotificationTypes] = useState(new Set());
  const notificationsPanelRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Function to fetch unread notifications count - AMÉLIORÉ
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get("/api/notifications/unread", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      const newCount = response.data.unread_count || 0;
      const newNotifications = response.data.notifications || [];
      
      // NOUVEAU: Détecter les types de nouvelles notifications
      const currentTypes = new Set(newNotifications.map(n => n.type));
      const hasNewTypes = [...currentTypes].some(type => !lastNotificationTypes.has(type));
      
      // Check if there are more unread notifications than before
      if (newCount > unreadCount && unreadCount >= 0) {
        setHasNewNotification(true);
        
        console.log("🔔 Nouvelles notifications administrateur détectées!", {
          previousCount: unreadCount,
          newCount: newCount,
          difference: newCount - unreadCount
        });
        
        // NOUVEAU: Son différent selon le type de notification
        const hasPaymentNotification = newNotifications.some(n => 
          n.title?.includes('Paiement') || n.title?.includes('payée')
        );
        const hasContactNotification = newNotifications.some(n => 
          n.title?.includes('contact')
        );
        
        // Play notification sound - son différent selon le type
        try {
          let soundFile = '/notification-sound.mp3'; // Son par défaut
          
          if (hasPaymentNotification) {
            soundFile = '/payment-notification.mp3'; // Son spécial pour les paiements
          } else if (hasContactNotification) {
            soundFile = '/contact-notification.mp3'; // Son spécial pour les contacts
          }
          
          const audio = new Audio(soundFile);
          audio.volume = 0.4; // Volume un peu plus fort pour l'admin
          audio.play().catch(e => {
            // Fallback au son par défaut
            if (soundFile !== '/notification-sound.mp3') {
              new Audio('/notification-sound.mp3').play().catch(() => {});
            }
          });
        } catch (soundError) {
          console.log('Could not play notification sound:', soundError);
        }
        
        // NOUVEAU: Effet visuel différent selon le type
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
        
        // NOUVEAU: Notification browser si l'onglet n'est pas actif
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          let notificationTitle = 'Nouvelle notification';
          let notificationBody = `Vous avez ${newCount} notification${newCount > 1 ? 's' : ''} non lue${newCount > 1 ? 's' : ''}`;
          
          if (hasPaymentNotification) {
            notificationTitle = '💰 Nouveau paiement reçu';
            notificationBody = 'Un paiement vient d\'être effectué';
          } else if (hasContactNotification) {
            notificationTitle = '📧 Nouveau message de contact';
            notificationBody = 'Un nouveau message de contact a été reçu';
          }
          
          new Notification(notificationTitle, {
            body: notificationBody,
            icon: '/favicon.ico',
            tag: 'admin-notification'
          });
        }
        
        // Reset the animation after 2 seconds
        setTimeout(() => setHasNewNotification(false), 2500);
      }
      
      setUnreadCount(newCount);
      setLastNotificationTypes(currentTypes);
      
    } catch (err) {
      console.error("Error fetching unread notifications:", err.response?.data || err.message);
    }
  };

  // Function to fetch system statistics
  const fetchSystemStats = async () => {
    try {
      const response = await axios.get("/api/notifications/system", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setSystemStats(response.data.stats);
    } catch (err) {
      console.error("Error fetching notification statistics:", err.response?.data || err.message);
    }
  };
  
  // NOUVEAU: Demander permission pour les notifications browser
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);
  
  // Set up polling when component mounts
  useEffect(() => {
    // Fetch immediately on mount
    fetchUnreadCount();
    fetchSystemStats();
    
    // Set up polling interval - RÉDUIT À 2 SECONDES pour l'admin
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
      if (showNotifications) {
        fetchSystemStats();
      }
    }, 2000); // 2 secondes pour les notifications critiques admin
    
    // Clean up interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [unreadCount, showNotifications]);
  
  // Add event listener to close notification panel when clicking outside
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
  
  // Toggle notification panel visibility
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && !systemStats) {
      fetchSystemStats();
    }
  };
  
  // Close notification panel
  const closeNotifications = () => {
    setShowNotifications(false);
  };
  
  // Update unread count (used by NotificationList)
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };
  
  return (
    <div className="notification-container" ref={notificationsPanelRef}>
      <button 
        className={`btn-secondary notification-btn ${hasNewNotification ? 'has-new-notification' : ''}`}
        onClick={toggleNotifications}
        title={`Notifications (${unreadCount} non lues)`}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className={`notification-badge ${hasNewNotification ? 'new-notification' : ''}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
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
      
      {/* NOUVEAU: Styles CSS pour les effets visuels */}
      <style jsx>{`
        .has-new-notification {
          animation: bounceNotification 0.6s ease-in-out;
        }
        
        .new-notification {
          animation: pulseNotificationBadge 1s ease-in-out infinite;
        }
        
        @keyframes bounceNotification {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
          60% { transform: translateY(-3px); }
        }
        
        @keyframes pulseNotificationBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        /* Styles globaux pour les différents types de flash */
        :global(.payment-notification-flash) {
          animation: flashPayment 1.5s ease-in-out;
        }
        
        :global(.contact-notification-flash) {
          animation: flashContact 1.5s ease-in-out;
        }
        
        :global(.new-notification-flash) {
          animation: flashNotification 1s ease-in-out;
        }
        
        @keyframes flashPayment {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(40, 167, 69, 0.15); }
        }
        
        @keyframes flashContact {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(23, 162, 184, 0.15); }
        }
        
        @keyframes flashNotification {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(108, 117, 125, 0.1); }
        }
        
        /* Amélioration du bouton de notification */
        .notification-btn {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .notification-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.75rem;
          font-weight: bold;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          transition: all 0.3s ease;
        }
        
        /* Badge spécial pour les nouvelles notifications importantes */
        .notification-badge.new-notification {
          background-color: #28a745;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .notification-btn {
            padding: 8px;
          }
          
          .notification-badge {
            top: -6px;
            right: -6px;
            font-size: 0.7rem;
            min-width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationButton;