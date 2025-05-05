// src/components/doctor-dashboard/NotificationButton.jsx
import React, { useState, useEffect, useRef } from "react";
import DoctorNotificationList from "./DoctorNotificationList";
import axios from "../../axios";

const NotificationButton = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const notificationsPanelRef = useRef(null);
  const pollingIntervalRef = useRef(null); // Reference to store the interval ID
  
  // Function to fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get("/api/notifications/unread", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Check if there are more unread notifications than before
      if (response.data.unread_count > unreadCount) {
        setHasNewNotification(true);
        
        // Play notification sound - you'll need to add an audio file to your project
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (soundError) {
          console.log('Could not play notification sound:', soundError);
        }
        
        // Reset the animation after 2 seconds
        setTimeout(() => setHasNewNotification(false), 2000);
      }
      
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error("Error fetching unread notifications:", err.response?.data || err.message);
      // Don't display error here, just keep the counter at its current value
    }
  };
  
  // Set up polling when component mounts
  useEffect(() => {
    // Fetch immediately on mount
    fetchUnreadCount();
    
    // Set up polling interval (every 5 seconds)
    pollingIntervalRef.current = setInterval(fetchUnreadCount, 5000);
    
    // Clean up interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [unreadCount]); // Include unreadCount in dependency array for comparisons
  
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
  };
  
  // Close notification panel
  const closeNotifications = () => {
    setShowNotifications(false);
  };
  
  // Update unread count (used by DoctorNotificationList)
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
          <span className={`notification-badge ${hasNewNotification ? 'new-notification' : ''}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notifications-panel">
          <DoctorNotificationList 
            onClose={closeNotifications} 
            onCountUpdate={updateUnreadCount} 
          />
        </div>
      )}
    </div>
  );
};

export default NotificationButton;