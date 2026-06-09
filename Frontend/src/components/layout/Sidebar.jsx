import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CalendarCheck, 
  Settings,
  CircleUserRound,
  Briefcase,
  ListChecks
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
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
        {user?.role === 'Admin' && (
          <>
            <NavLink to="/app/departments" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Building2 size={20} />
              <span>Departments</span>
            </NavLink>
            <NavLink to="/app/attendance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <CalendarCheck size={20} />
              <span>Attendance</span>
            </NavLink>
            <NavLink to="/app/audit-logs" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <ListChecks size={20} />
              <span>Audit Logs</span>
            </NavLink>
            <NavLink to="/app/members" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Users size={20} />
              <span>Users</span>
            </NavLink>
          </>
        )}
        <NavLink to="/app/company" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Briefcase size={20} />
          <span>Company</span>
        </NavLink>
        <NavLink to="/app/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar" style={{ overflow: 'hidden' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <CircleUserRound size={32} />
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
            <span className="user-role">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
