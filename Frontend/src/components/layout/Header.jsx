import { Search, Bell, Menu, ChevronDown, CircleUserRound } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn">
          <Menu size={20} color="#64748B" />
        </button>
        <div className="search-bar">
          <Search size={18} color="#94A3B8" className="search-icon" />
          <input type="text" placeholder="Search here..." />
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn notification-btn">
          <Bell size={20} color="#64748B" />
          <span className="notification-badge"></span>
        </button>
        
        
      </div>
    </header>
  );
};

export default Header;
