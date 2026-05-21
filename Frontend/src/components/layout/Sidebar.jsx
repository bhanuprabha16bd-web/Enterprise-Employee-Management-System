import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CalendarCheck, 
  Settings,
  CircleUserRound
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <CircleUserRound size={24} color="#fff" />
        </div>
        <h2>EEMS</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/app" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/app/employees" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Users size={20} />
          <span>Employees</span>
        </NavLink>
        <NavLink to="/app/departments" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Building2 size={20} />
          <span>Departments</span>
        </NavLink>
        <NavLink to="/app/attendance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <CalendarCheck size={20} />
          <span>Attendance</span>
        </NavLink>
        <NavLink to="/app/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <CircleUserRound size={32} />
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
