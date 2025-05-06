// src/components/patient-dashboard/NotificationList.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "../../axios";

const NotificationList = ({ onClose, onCountUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // Fetch notifications function
  const fetchNotifications = async () => {
    try {
      setError(null); // Reset error before loading
      
      const response = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      setNotifications(response.data.notifications || []);
      if (onCountUpdate) {
        onCountUpdate(response.data.unread_count || 0);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", 
                   err.response?.data || err.message);
      setError("Unable to load notifications. Please try again later.");
      setLoading(false);
    }
  };
  
  // Set up polling for notifications when component mounts
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up polling interval (every 5 seconds)
    pollingIntervalRef.current = setInterval(fetchNotifications, 5000);
    
    // Clean up interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
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
    e.stopPropagation(); // Prevent marking as read at the same time
    
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
  
  // Format relative time (X minutes ago, etc.)
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
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
      case 'invoice':
        return 'fa-file-invoice-dollar text-success';
      default:
        return 'fa-bell text-primary';
    }
  };
  
  // Play notification sound when a new notification arrives
  useEffect(() => {
    // Check if there's a new notification (compare with a previous state)
    const prevNotificationCount = notifications.filter(n => !n.read_at).length;
    const currentNotificationCount = notifications.filter(n => !n.read_at).length;
    
    if (currentNotificationCount > prevNotificationCount && currentNotificationCount > 0) {
      // Play notification sound - you'd need to add an audio file to your project
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [notifications]);
  
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
            <i className="fas fa-check-double"></i> Mark all as read
          </button>
          <button className="btn-icon" onClick={onClose} title="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div className="notifications-body">
        {loading ? (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i> Loading...
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <i className="fas fa-bell-slash"></i>
            <p>No notifications</p>
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
                      title="View details"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Link>
                  )}
                  <button 
                    className="btn-icon danger" 
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Delete"
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
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>
  );
};

export default NotificationList;