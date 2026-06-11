import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Shield, Bell, Moon, Sun, Save, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@example.com',
    avatar: user?.avatar || null,
    bio: 'Software Engineer dedicated to building awesome products.'
  });

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileData({ ...profileData, avatar: null });
  };

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [roleRequestData, setRoleRequestData] = useState({
    currentPassword: '',
    adminEmail: ''
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingReactivationRequests, setPendingReactivationRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (user?.role !== 'Admin') return;
    setFetchingRequests(true);
    try {
      const [roleResponse, reactivationResponse] = await Promise.all([
        api.get('/users/role-requests'),
        api.get('/users/reactivation-requests/admin')
      ]);
      setPendingRequests(roleResponse.data || []);
      setPendingReactivationRequests(reactivationResponse.data || []);
    } catch {
      // Handled by api interceptor
    } finally {
      setFetchingRequests(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (activeTab === 'approvals') {
      Promise.resolve().then(fetchRequests);
    }
  }, [activeTab, fetchRequests]);

  const handleApproval = async (id, status) => {
    try {
      const response = await api.put(`/users/role-requests/${id}`, { status });
      toast.success(response.data.message || `Request ${status} successfully`);
      fetchRequests();
    } catch {
      // Handled by api interceptor
    }
  };

  const handleReactivationApproval = async (id, status) => {
    try {
      const response = await api.put(`/users/reactivation-requests/${id}`, { status });
      toast.success(response.data.message || `Reactivation request ${status.toLowerCase()} successfully`);
      fetchRequests();
    } catch {
      // Handled by api interceptor
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (updateUser) {
        updateUser({ name: profileData.name, email: profileData.email, avatar: profileData.avatar });
      }
      toast.success('Profile updated successfully!');
    }, 800);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully!');
    }, 800);
  };

  const handleRoleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/users/request-role', {
        current_password: roleRequestData.currentPassword,
        admin_email: roleRequestData.adminEmail
      });
      toast.success(response.data.message || 'Role request submitted successfully!');
      setRoleRequestData({ currentPassword: '', adminEmail: '' });
    } catch {
      // API interceptor handles error toasts
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-pane slide-in">
            <h2>My Profile</h2>
            <p className="pane-subtitle">Update your personal information and public profile.</p>
            
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="profile-picture-section">
                <div className="avatar-lg">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    profileData.name.charAt(0)
                  )}
                </div>
                <div className="avatar-actions">
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleImageChange} 
                  />
                  <button type="button" className="btn-outline-primary btn-sm" onClick={() => fileInputRef.current.click()}>
                    Change Picture
                  </button>
                  <button type="button" className="btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={handleRemoveImage}>
                    Remove
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  rows="4"
                  value={profileData.bio} 
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})} 
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'security':
        return (
          <div className="settings-pane slide-in">
            <h2>Security</h2>
            <p className="pane-subtitle">Manage your password and account security.</p>
            
            <form onSubmit={handleSecuritySubmit} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={securityData.currentPassword} 
                  onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})} 
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={securityData.newPassword} 
                  onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={securityData.confirmPassword} 
                  onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})} 
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : <><Shield size={18} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-pane slide-in">
            <h2>Appearance</h2>
            <p className="pane-subtitle">Customize the look and feel of your workspace.</p>
            
            <div className="theme-toggle-section">
              <div className="theme-info">
                <h3>Dark Mode</h3>
                <p>Toggle between dark and light themes for the application interface.</p>
              </div>
              <button 
                className={`theme-toggle-btn ${theme === 'dark' ? 'dark-active' : 'light-active'}`}
                onClick={toggleTheme}
              >
                <div className="toggle-slider">
                  {theme === 'dark' ? <Moon size={16} color="white" /> : <Sun size={16} color="#F59E0B" />}
                </div>
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-pane slide-in">
            <h2>Notifications</h2>
            <p className="pane-subtitle">Manage how you receive alerts and updates.</p>
            
            <div className="notification-list">
              <div className="notification-item">
                <div className="notif-details">
                  <h4>Email Notifications</h4>
                  <p>Receive daily summaries of attendance and system alerts.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notif-details">
                  <h4>Push Notifications</h4>
                  <p>Get instant browser alerts for important employee events.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'role-request':
        return (
          <div className="settings-pane slide-in">
            <h2>Role Request</h2>
            <p className="pane-subtitle">Request an upgrade to the Admin role.</p>
            
            <form onSubmit={handleRoleRequestSubmit} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={roleRequestData.currentPassword} 
                  onChange={(e) => setRoleRequestData({...roleRequestData, currentPassword: e.target.value})} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Email</label>
                <input 
                  type="email" 
                  value={roleRequestData.adminEmail} 
                  onChange={(e) => setRoleRequestData({...roleRequestData, adminEmail: e.target.value})} 
                  required
                  placeholder="admin@example.com"
                />
                <small style={{ color: 'var(--text-muted)' }}>Enter the email address of the Admin who will review your request.</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : <><UserPlus size={18} /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        );

      case 'approvals':
        return (
          <div className="settings-pane slide-in">
            <h2>Role Approvals</h2>
            <p className="pane-subtitle">Manage pending role upgrade requests.</p>
            
            <div className="requests-container" style={{ marginTop: '24px', display: 'grid', gap: '18px' }}>
              {fetchingRequests ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading requests...</div>
              ) : (
                <>
                  <section style={{ display: 'grid', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>Role Upgrade Requests</h3>
                    {pendingRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                        No pending role requests found.
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', gap: '12px' }}>
                          <div className="req-info">
                            <h4 style={{ margin: '0 0 4px 0' }}>{req.user_name}</h4>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{req.user_email}</div>
                          </div>
                          <div className="req-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary btn-sm" onClick={() => handleApproval(req.id, 'Approved')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={16} /> Approve
                            </button>
                            <button className="btn-outline-primary btn-sm" onClick={() => handleApproval(req.id, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                              <XCircle size={16} /> Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  <section style={{ display: 'grid', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>Reactivation Requests</h3>
                    {pendingReactivationRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                        No pending reactivation requests found.
                      </div>
                    ) : (
                      pendingReactivationRequests.map((req) => (
                        <div key={req.id} style={{ display: 'grid', gap: '6px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0' }}>{req.user_name || req.user_email || 'Deactivated user'}</h4>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{req.reason || 'No reason provided.'}</div>
                            </div>
                            <div className="req-actions" style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-primary btn-sm" onClick={() => handleReactivationApproval(req.id, 'Approved')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button className="btn-outline-primary btn-sm" onClick={() => handleReactivationApproval(req.id, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Submitted: {new Date(req.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Profile
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} /> Security
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} /> Notifications
            </button>
            {user?.role?.toLowerCase() !== 'admin' && (
              <button 
                className={`settings-nav-item ${activeTab === 'role-request' ? 'active' : ''}`}
                onClick={() => setActiveTab('role-request')}
              >
                <UserPlus size={18} /> Role Request
              </button>
            )}
            {user?.role === 'Admin' && (
              <button 
                className={`settings-nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setActiveTab('approvals')}
              >
                <CheckCircle size={18} /> Approvals
              </button>
            )}
          </nav>
        </aside>

        <main className="settings-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default Settings;
