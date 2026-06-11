import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Sun, Moon, LogOut, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { logout } = useAuth();
  const { user } = useAuth();
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const fetchedRoleRequestsRef = useRef(false);
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchRequestsForNotifications = async () => {
      if (user?.role !== 'Admin' || fetchedRoleRequestsRef.current) return;

      try {
        const [roleRes, reactivationRes] = await Promise.all([
          api.get('/users/role-requests'),
          api.get('/users/reactivation-requests/admin'),
        ]);

        const messages = [];
        (roleRes.data || []).forEach((req) => {
          messages.push(`New role request from ${req.user_name}`);
        });
        (reactivationRes.data || []).forEach((req) => {
          messages.push(`Reactivation request from ${req.user_name || req.user_email || 'a deactivated user'}`);
        });

        if (messages.length > 0 && notifications.length === 0) {
          messages.forEach((message) => addNotification(message, 'info'));
        }
        fetchedRoleRequestsRef.current = true;
      } catch (error) {
        console.error('Failed to fetch approval notifications', error);
      }
    };

    fetchRequestsForNotifications();
  }, [user, addNotification, notifications.length]);

  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn" onClick={toggleSidebar}>
          <Menu size={20} color="var(--color-text-secondary)" />
        </button>
        
      </div>
      
      <div className="header-right">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <Sun size={20} color="var(--color-text-secondary)" /> : <Moon size={20} color="var(--color-text-secondary)" />}
        </button>

        <div className="notification-wrapper" ref={notificationRef}>
          <button className="icon-btn notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--color-text-secondary)" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <div className="notification-actions">
                  <button onClick={markAllAsRead}>Mark all read</button>
                  <button onClick={clearNotifications}>Clear</button>
                </div>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span className="notification-time">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.read && <span className="unread-dot"></span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="icon-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
          <LogOut size={20} color="var(--color-danger)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
