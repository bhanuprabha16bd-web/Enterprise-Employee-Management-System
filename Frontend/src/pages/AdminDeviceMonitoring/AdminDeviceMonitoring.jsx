import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, MonitorOff, UserX } from 'lucide-react';
import './AdminDeviceMonitoring.css';
import toast from 'react-hot-toast';

const AdminDeviceMonitoring = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedSessions, setSelectedSessions] = useState([]);

  const loadSessions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sessions/admin', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const loadedSessions = response.data || [];
      setSessions(loadedSessions);
    } catch (error) {
      toast.error('Failed to load company sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const updateSessionStatus = (sessionId, newStatus) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId ? { ...session, status: newStatus } : session
    ));
  };

  const revokeDeviceSession = async (id) => {
    return axios.post('http://localhost:8000/sessions/admin/revoke', { session_ids: [id] }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  };

  const forceLogoutDeviceSession = async (id) => {
    return axios.post(`http://localhost:8000/sessions/admin/${id}/force-logout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  };

  const handleAdminRevoke = async (session, message = 'Session revoked') => {
    try {
      await revokeDeviceSession(session.id);
      updateSessionStatus(session.id, 'Revoked');
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke session');
    }
  };
 
  const handleAdminForceLogout = async (session) => {
    try {
      await forceLogoutDeviceSession(session.id);
      updateSessionStatus(session.id, 'Revoked');
      toast.success('Session force logged out');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to force logout');
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedSessions.length === 0) return;
    if (window.confirm(`Are you sure you want to revoke ${selectedSessions.length} session(s)?`)) {
      try {
        await axios.post('http://localhost:8000/sessions/admin/revoke', { session_ids: selectedSessions }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSessions(prev => prev.map(session =>
          selectedSessions.includes(session.id) ? { ...session, status: 'Revoked' } : session
        ));
        toast.success('Sessions revoked successfully');
        setSelectedSessions([]);
      } catch (error) {
        toast.error('Failed to revoke sessions');
      }
    }
  };

  const toggleSelectSession = (id) => {
    setSelectedSessions(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const getDisplayStatus = (status) => {
    if (!status || String(status).toLowerCase() === 'active') return 'Active';
    return status;
  };

  const filteredSessions = sessions.filter(s => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = (s.user_email || '').toLowerCase().includes(searchValue) ||
                          (s.user_name || '').toLowerCase().includes(searchValue) ||
                          (s.device_name || '').toLowerCase().includes(searchValue) ||
                          (s.browser || '').toLowerCase().includes(searchValue);
    const displayStatus = getDisplayStatus(s.status);
    const matchesStatus = filterStatus === 'All' || displayStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="loading-state">Loading company devices...</div>;

  return (
    <div className="admin-devices-container fade-in">
      <div className="admin-header">
        <div>
          <h2>Device & Session Monitoring</h2>
          <p>Monitor and manage active sessions across your organization.</p>
        </div>
        {selectedSessions.length > 0 && (
          <button className="btn-bulk-revoke" onClick={handleBulkRevoke}>
            <ShieldAlert size={16} /> Revoke Selected ({selectedSessions.length})
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by user name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="status-filter" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Logged Out">Logged Out</option>
          <option value="Revoked">Revoked</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div className="table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSessions(filteredSessions.map(s => s.id));
                } else {
                  setSelectedSessions([]);
                }
              }} checked={selectedSessions.length > 0 && selectedSessions.length === filteredSessions.length} /></th>
              <th>User</th>
              <th>Device & Browser</th>
              <th>IP Address</th>
              <th>Login Time</th>
              <th>Last Activity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(session => (
              <tr key={session.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => toggleSelectSession(session.id)}
                  />
                </td>
                <td>
                  <div className="user-cell">
                    <span className="user-name">{session.user_name}</span>
                    <span className="user-email">{session.user_email}</span>
                  </div>
                </td>
                <td>
                  <div className="device-cell">
                    <span className="device-name">{session.device_name || 'Unknown'}</span>
                    <span className="browser-name">{session.browser || 'Unknown'}</span>
                  </div>
                </td>
                <td>{session.ip_address || 'N/A'}</td>
                <td>{new Date(session.login_time).toLocaleString()}</td>
                <td>{new Date(session.last_activity).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${getDisplayStatus(session.status).toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`}>
                    {getDisplayStatus(session.status)}
                  </span>
                </td>
                <td>
                  <select 
                    className="admin-action-select"
                    defaultValue=""
                    onChange={(event) => {
                      const action = event.target.value;
                      event.target.value = '';
                      if (action === 'force') handleAdminForceLogout(session);
                      if (action === 'revoke') handleAdminRevoke(session, 'Session revoked');
                    }}
                  >
                    <option value="">Select Action</option>
                    <option value="force">Force Logout</option>
                    <option value="revoke">Revoke Session</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredSessions.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4">No sessions found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDeviceMonitoring;
 
