import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Monitor, Smartphone, Globe, LogOut, CheckCircle, Clock, MoreVertical, Edit2 } from 'lucide-react';
import './LoginDevices.css';
import toast from 'react-hot-toast';

const LoginDevices = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localStatuses, setLocalStatuses] = useState({});

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutDevice = async (sessionId) => {
    try {
      await axios.post(`http://localhost:8000/sessions/${sessionId}/logout`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSessions(prev => prev.map(session =>
        session.id === sessionId ? { ...session, status: 'Logged Out' } : session
      ));
      setLocalStatuses(prev => ({ ...prev, [sessionId]: 'Logged Out' }));
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleToggleTrusted = async (sessionId, trusted) => {
    try {
      await axios.patch(`http://localhost:8000/sessions/${sessionId}/trusted?trusted=${trusted}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(trusted ? 'Device trusted' : 'Device untrusted');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRename = async (sessionId) => {
    const newName = prompt('Enter new name for this device:');
    if (newName) {
      try {
        await axios.patch(`http://localhost:8000/sessions/${sessionId}/rename`, { device_name: newName }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Device renamed');
        fetchSessions();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to rename device');
      }
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to log out of all other devices?')) {
      try {
        await axios.post('http://localhost:8000/sessions/logout-all', {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Logged out of all other devices');
        fetchSessions();
      } catch (error) {
        toast.error('Failed to log out of all devices');
      }
    }
  };

  const getDeviceIcon = (deviceStr) => {
    const lower = (deviceStr || '').toLowerCase();
    if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) return <Smartphone size={20} />;
    if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) return <Monitor size={20} />;
    return <Globe size={20} />;
  };

  if (loading) return <div className="loading-state">Loading your devices...</div>;

  return (
    <div className="login-devices-container fade-in">
      <div className="devices-header">
        <div>
          <h2>Your Login Devices</h2>
          <p>Manage the devices where you're currently logged in.</p>
        </div>
        <button className="btn-logout-all" onClick={handleLogoutAll}>
          <LogOut size={16} /> Logout from all devices except the current session
        </button>
      </div>

      <div className="devices-list">
        {sessions.map(session => {
          const rawStatus = localStatuses[session.id] || session.status || 'Active';
          const displayStatus = rawStatus === 'Active' || rawStatus === 'active' ? 'active' : rawStatus;
          return (
          <div key={session.id} className={`device-card ${displayStatus !== 'active' ? 'inactive' : ''}`}>
            <div className="device-icon">
              {getDeviceIcon(session.device_name || session.browser)}
            </div>
            
            <div className="device-info">
              <h3>{session.device_name || 'Unknown Device'} {session.trusted && <span className="trusted-badge"><CheckCircle size={12}/> Trusted</span>}</h3>
              <p className="browser-info">{session.browser || 'Unknown Browser'} • {session.ip_address || 'Unknown IP'}</p>
              <p className="login-time"><Clock size={12} /> Last active: {new Date(session.last_activity).toLocaleString()}</p>
              <div className={`status-badge status-${displayStatus.toLowerCase().replace(' ', '-')}`}>
                {displayStatus}
              </div>
            </div>

            {displayStatus === 'Active' && (
              <div className="device-actions-vertical">
                <button className="text-action-btn" onClick={() => handleRename(session.id)}>
                  <Edit2 size={14} /> Rename a trusted device.
                </button>
                <button className={`text-action-btn ${session.trusted ? 'text-danger' : ''}`} onClick={() => handleToggleTrusted(session.id, !session.trusted)}>
                  <CheckCircle size={14} className={session.trusted ? "text-success" : ""} /> {session.trusted ? "Remove a trusted device" : "Add as a trusted device"}
                </button>
                <button className="text-action-btn" onClick={() => handleLogoutDevice(session.id)}>
                  <LogOut size={14} /> Logout from a selected device
                </button>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

export default LoginDevices;
