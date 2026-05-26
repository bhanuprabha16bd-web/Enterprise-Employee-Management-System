import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Sun, Moon, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn">
          <Menu size={20} color="var(--color-text-secondary)" />
        </button>
        <div className="search-bar">
          <Search size={18} color="var(--color-text-tertiary)" className="search-icon" />
          <input type="text" placeholder="Search here..." />
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <Sun size={20} color="var(--color-text-secondary)" /> : <Moon size={20} color="var(--color-text-secondary)" />}
        </button>

        <button className="icon-btn notification-btn">
          <Bell size={20} color="var(--color-text-secondary)" />
          <span className="notification-badge"></span>
        </button>

        <button className="icon-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
          <LogOut size={20} color="var(--color-danger)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
