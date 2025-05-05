// src/components/admin-dashboard/AdminNotificationList.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "../../axios";

const AdminNotificationList = ({ onClose, onCountUpdate, systemStats }) => {
  const [notifications, setNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("personal"); // "personal" or "system"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null); // Reference to store the interval ID
  
  // Set up polling for notifications when component mounts or viewMode changes
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
    
    // Set up polling interval (every 5 seconds)
    pollingIntervalRef.current = setInterval(() => {
      if (viewMode === "personal") {
        fetchPersonalNotifications();
      } else {
        fetchSystemNotifications();
      }
    }, 5000);
    
    // Clean up interval when component unmounts or viewMode changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [viewMode]);
  
  // Function to fetch personal notifications
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
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err.response?.data || err.message);
      setError("Unable to load notifications. Please try again later.");
      setLoading(false);
    }
  };
  
  // Function to fetch system notifications (admin only)
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
      setError("Unable to load system notifications. Please try again later.");
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
      alert("Notifications sent successfully");
      
      // Refresh the data
      fetchSystemNotifications();
    } catch (err) {
      console.error("Error sending notifications:", err);
      alert("Error sending notifications: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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
        return <span className="role-badge doctor">Doctor</span>;
      case 'patient':
        return <span className="role-badge patient">Patient</span>;
      default:
        return null;
    }
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
              <i className="fas fa-user"></i> Personal
            </button>
            <button 
              className={`btn-sm ${viewMode === "system" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewMode("system")}
            >
              <i className="fas fa-server"></i> System
            </button>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      {viewMode === "personal" ? (
        // Personal notifications view
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-outline"
              onClick={handleMarkAllAsRead}
              disabled={notifications.every(n => n.read_at) || notifications.length === 0 || loading}
            >
              <i className="fas fa-check-double"></i> Mark all as read
            </button>
          </div>
          
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
      ) : (
        // System notifications view (admin)
        <div className="notifications-body">
          <div className="notifications-controls">
            <button 
              className="btn-sm btn-primary"
              onClick={() => setShowNotifyForm(!showNotifyForm)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i> New notification
            </button>
            
            {/* System stats display */}
            {systemStats && (
              <div className="system-stats">
                <div className="stats-item">
                  <span className="stats-label">Total:</span>
                  <span className="stats-value">{systemStats.total}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Unread:</span>
                  <span className="stats-value">{systemStats.unread}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Today:</span>
                  <span className="stats-value">{systemStats.today}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Form to send notifications to a role */}
          {showNotifyForm && (
            <div className="notify-form">
              <h4>Send notification</h4>
              <form onSubmit={handleNotifySubmit}>
                <div className="form-group">
                  <label htmlFor="role">Recipients</label>
                  <select 
                    id="role" 
                    name="role" 
                    value={notifyFormData.role}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                  >
                    <option value="patient">All patients</option>
                    <option value="doctor">All doctors</option>
                    <option value="admin">All administrators</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title"
                    value={notifyFormData.title}
                    onChange={handleNotifyFormChange}
                    required
                    disabled={loading}
                    placeholder="Notification title"
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
                    placeholder="Message content"
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
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="appointment">Appointment</option>
                    <option value="medical">Medical record</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="link">Link (optional)</label>
                  <input 
                    type="text" 
                    id="link" 
                    name="link"
                    value={notifyFormData.link}
                    onChange={handleNotifyFormChange}
                    disabled={loading}
                    placeholder="Redirect URL (optional)"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>} Send
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowNotifyForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loading ? (
            <div className="loading-indicator">
              <i className="fas fa-spinner fa-spin"></i> Loading...
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          ) : systemNotifications.length === 0 ? (
            <div className="empty-notifications">
              <i className="fas fa-server"></i>
              <p>No system notifications to display</p>
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
                        Recipient: <span className="recipient-name">{notification.user?.name || "Unknown"}</span>
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
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        ) : (
          <button 
            className="btn-sm btn-outline" 
            onClick={fetchSystemNotifications}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationList;