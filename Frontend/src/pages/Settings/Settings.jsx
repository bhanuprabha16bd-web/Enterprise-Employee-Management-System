import { useState, useRef } from 'react';
import { User, Shield, Bell, Moon, Sun, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and system configuration.</p>
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
