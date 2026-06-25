import { useState, useEffect } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import './ActivityTracking.css';

/**
 * ActivityTracking Component.
 * Displays a list of users with their login/logout times, IPs, and device info.
 * Highlights users with new device or new IP login alerts.
 */
const ActivityTracking = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetches user activity data from the backend.
   */
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load activity tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats a date string for display.
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted local date string or 'Never'
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="activity-container">
        <div className="activity-header">
          <h2>Account Activity Tracking</h2>
        </div>
        <div className="loading-state">Loading activity data...</div>
      </div>
    );
  }

  return (
    <div className="activity-container">
      <div className="activity-header">
        <h2>Account Activity Tracking</h2>
        <p>Monitor user login sessions, IP addresses, and device usage.</p>
      </div>

      <div className="activity-card">
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Last Login</th>
                <th>Last Logout</th>
                <th>Browser / Device</th>
                <th>IP Address</th>
                <th>Alerts</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={(user.is_new_device_login || user.is_new_ip_login) ? 'highlight-row' : ''}>
                  <td>
                    <div className="user-info-cell">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </td>
                  <td>{formatDate(user.last_login)}</td>
                  <td>{formatDate(user.last_logout)}</td>
                  <td>
                    <span className="browser-info" title={user.last_browser}>
                      {user.last_browser ? (user.last_browser.length > 30 ? user.last_browser.substring(0, 30) + '...' : user.last_browser) : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="ip-info">{user.last_ip_address || 'N/A'}</span>
                  </td>
                  <td>
                    <div className="alerts-cell">
                      {user.is_new_device_login && (
                        <div className="alert-badge warning" title="New Device Detected on Last Login">
                          <ShieldAlert size={14} />
                          <span>New Device</span>
                        </div>
                      )}
                      {user.is_new_ip_login && (
                        <div className="alert-badge warning" title="New IP Address Detected on Last Login">
                          <ShieldAlert size={14} />
                          <span>New IP</span>
                        </div>
                      )}
                      {!user.is_new_device_login && !user.is_new_ip_login && (
                        <span className="no-alerts">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityTracking;
