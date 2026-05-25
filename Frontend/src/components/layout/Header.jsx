import { useState, useEffect } from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      </div>
    </header>
  );
};

export default Header;
