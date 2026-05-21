import { useState, useEffect } from 'react';
import { Users, UserCheck, CalendarCheck, Building2, TrendingUp, MoreHorizontal } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(res => res.json())
      .then(data => {
        
        const formatted = data.map(user => ({
          name: user.name,
          role: `@${user.username}`, 
          dept: user.company.name, 
          date: 'May 21, 2025'
        }));
        setRecentEmployees(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, Admin! Here's what's happening.</p>
        </div>
        <div className="date-picker">
          <CalendarCheck size={18} color="#64748B" />
          <span>May 21, 2025</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Employees</span>
            <h3 className="stat-value">100</h3>
            <span className="stat-change positive">
              <TrendingUp size={14} /> + 12.5% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <UserCheck size={24} color="var(--color-success)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Active Employees</span>
            <h3 className="stat-value">77</h3>
            <span className="stat-change positive">
              <TrendingUp size={14} /> + 8.3% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <CalendarCheck size={24} color="#8B5CF6" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Attendance Today</span>
            <h3 className="stat-value">90%</h3>
            <span className="stat-change positive">
              <TrendingUp size={14} /> + 5.4% from yesterday
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Building2 size={24} color="var(--color-warning)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Departments</span>
            <h3 className="stat-value">10</h3>
            <span className="stat-change neutral">
              No change
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Employee Overview</h3>
            <select className="select-sm">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="chart-placeholder">
            
            <div className="mock-chart-line"></div>
          </div>
        </div>

        <div className="recent-employees-card">
          <div className="card-header">
            <h3>Recent Employees</h3>
            <a href="#" className="view-all">View All</a>
          </div>
          <div className="recent-list">
            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading employees...</p>
            ) : recentEmployees.map((emp, index) => (
              <div className="recent-item" key={index}>
                <div className="recent-user-info">
                  <div className="recent-avatar">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="recent-name">{emp.name}</h4>
                    <span className="recent-role">{emp.role}</span>
                  </div>
                </div>
                <div className="recent-dept">{emp.dept}</div>
                <div className="recent-date">{emp.date}</div>
                <button className="icon-btn-sm">
                  <MoreHorizontal size={16} color="#94A3B8" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
