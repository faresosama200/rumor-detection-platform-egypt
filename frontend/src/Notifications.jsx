import { useState, useEffect, createContext, useContext } from 'react';

const NotificationsContext = createContext();

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const success = (message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  };

  const error = (message, options = {}) => {
    return addNotification({ type: 'error', message, duration: 8000, ...options });
  };

  const warning = (message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  };

  const info = (message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      success,
      error,
      warning,
      info,
    }}>
      {children}
      <NotificationContainer />
    </NotificationsContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function Notification({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getClassName = () => {
    return `notification notification-${notification.type}`;
  };

  return (
    <div className={getClassName()}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon()}</span>
        <span className="notification-message">{notification.message}</span>
        {notification.title && (
          <span className="notification-title">{notification.title}</span>
        )}
      </div>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default NotificationsProvider;
