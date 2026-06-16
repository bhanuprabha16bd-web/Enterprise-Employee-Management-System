import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Sun, Moon, LogOut } from 'lucide-react';
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
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification, removeNotification } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
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
    if (user?.role !== 'Admin') return;

    const fetchRequestsForNotifications = async () => {
      try {
        const [roleRes, reactivationRes, attendanceRes, leaveRes] = await Promise.all([
          api.get('/users/role-requests'),
          api.get('/users/reactivation-requests/admin'),
          api.get('/users/attendance-requests/admin'),
          api.get('/leaves/admin')
        ]);

        const messages = [];
        const pendingAttendanceIds = new Set((attendanceRes.data || []).map((req) => req.id));

        notifications.forEach((notif) => {
          if (notif.metaData?.type === 'attendance_request' && !pendingAttendanceIds.has(notif.metaData.id)) {
            removeNotification(notif.id);
          }
        });

        (roleRes.data || []).forEach((req) => {
          const exists = notifications.some((notif) => notif.metaData?.type === 'role_request' && notif.metaData?.id === req.id);
          if (!exists) {
            messages.push({
              text: `New role request from ${req.user_name}`,
              type: 'info',
              meta: { type: 'role_request', id: req.id }
            });
          }
        });
        (reactivationRes.data || []).forEach((req) => {
          const exists = notifications.some((notif) => notif.metaData?.type === 'reactivation_request' && notif.metaData?.id === req.id);
          if (!exists) {
            messages.push({
              text: `Reactivation request from ${req.user_name || req.user_email || 'a deactivated user'}`,
              type: 'info',
              meta: { type: 'reactivation_request', id: req.id, timestamp: req.created_at }
            });
          }
        });
        (attendanceRes.data || []).forEach((req) => {
          const exists = notifications.some((notif) => notif.metaData?.type === 'attendance_request' && notif.metaData?.id === req.id);
          if (!exists) {
            messages.push({
              text: `Attendance Access Request`,
              type: 'info',
              meta: {
                type: 'attendance_request',
                id: req.id,
                userName: req.user_name,
                userEmail: req.user_email,
                timestamp: req.created_at
              }
            });
          }
        });
        (leaveRes.data || []).forEach((req) => {
          if (req.status === 'Pending') {
            const exists = notifications.some((notif) => notif.metaData?.type === 'leave_request' && notif.metaData?.id === req.id);
            if (!exists) {
              messages.push({
                text: `Leave Request from ${req.user_name || 'Unknown'}`,
                type: 'info',
                meta: {
                  type: 'leave_request',
                  id: req.id,
                  userName: req.user_name,
                  leaveType: req.leave_type,
                  startDate: req.start_date,
                  endDate: req.end_date,
                  reason: req.reason,
                  timestamp: req.created_at
                }
              });
            }
          }
        });

        if (messages.length > 0) {
          messages.forEach((msg) => addNotification(msg.text, msg.type, msg.meta));
        }
      } catch (error) {
        console.error('Failed to fetch approval notifications', error);
      }
    };

    fetchRequestsForNotifications();
    const intervalId = setInterval(fetchRequestsForNotifications, 5000);

    return () => clearInterval(intervalId);
  }, [user?.role, addNotification, notifications, removeNotification]);

  const handleAttendanceAction = async (e, requestId, status, notifId) => {
    e.stopPropagation();
    try {
      await api.put(`/users/attendance-requests/${requestId}`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      removeNotification(notifId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update request');
    }
  };

  const handleLeaveAction = async (e, leaveId, status, notifId) => {
    e.stopPropagation();
    try {
      await api.put(`/leaves/${leaveId}`, { status });
      toast.success(`Leave request ${status.toLowerCase()} successfully`);
      removeNotification(notifId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update leave request');
    }
  };



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
                      <div className="notification-content" style={{ width: '100%' }}>
                        <p style={{ fontWeight: notif.metaData?.type ? '600' : '400' }}>{notif.message}</p>
                        {notif.metaData?.type === 'attendance_request' && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <p><strong>Name:</strong> {notif.metaData.userName || 'Unknown'}</p>
                            <p><strong>Email:</strong> {notif.metaData.userEmail}</p>
                            <p><strong>Requested:</strong> {new Date(notif.metaData.timestamp).toLocaleString()}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button 
                                onClick={(e) => handleAttendanceAction(e, notif.metaData.id, 'Approved', notif.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={(e) => handleAttendanceAction(e, notif.metaData.id, 'Rejected', notif.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                        {notif.metaData?.type === 'leave_request' && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <p><strong>Name:</strong> {notif.metaData.userName || 'Unknown'}</p>
                            <p><strong>Type:</strong> {notif.metaData.leaveType}</p>
                            <p><strong>Dates:</strong> {notif.metaData.startDate} to {notif.metaData.endDate}</p>
                            <p><strong>Reason:</strong> {notif.metaData.reason || 'No reason provided'}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button 
                                onClick={(e) => handleLeaveAction(e, notif.metaData.id, 'Approved', notif.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={(e) => handleLeaveAction(e, notif.metaData.id, 'Rejected', notif.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                        <span className="notification-time">
                          {new Date(notif.metaData?.timestamp || notif.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
