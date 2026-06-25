import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider Component.
 * Provides a global context for managing application notifications.
 * Includes methods for adding, removing, and reading notifications.
 */
export const NotificationProvider = ({ children }) => {
  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]);

  // --- NOTIFICATION EFFECTS & FUNCTIONS ---

  /**
   * Adds a new notification to the state.
   */
  const addNotification = useCallback((message, type = 'info', metaData = null) => {
    const newNotification = {
      id: Date.now().toString() + Math.random().toString(),
      message,
      type,
      read: false,
      timestamp: new Date(),
      metaData
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  /**
   * Removes a notification by its unique ID.
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  /**
   * Marks a specific notification as read.
   */
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  }, []);

  /**
   * Marks all notifications as read.
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  /**
   * Clears all notifications from the state.
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
