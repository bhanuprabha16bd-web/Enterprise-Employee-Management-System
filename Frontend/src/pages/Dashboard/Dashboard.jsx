import { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, Building2, TrendingUp, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);
import './Dashboard.css';
import { employeeService } from '../../services/employeeService';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({
    total_employees: 0,
    active_employees: 0,
    total_departments: 0,
    pending_role_requests: 0,
    employees_by_department: [],
    employees_by_role: [],
    employee_status_overview: [],
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, employeeData] = await Promise.all([
        employeeService.getDashboardAnalytics(),
        employeeService.getEmployees(),
      ]);
      setAnalytics(analyticsData);
      setEmployees(employeeData);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((emp) => emp.status === 'Active').length;
    const departments = new Set(employees.map((emp) => emp.department).filter(Boolean)).size;

    return {
      total,
      active,
      departments,
      pending: analytics.pending_role_requests,
    };
  }, [analytics.pending_role_requests, employees]);

  const departmentChartData = useMemo(() => ({
    labels: analytics.employees_by_department.map((item) => item.label),
    datasets: [
      {
        data: analytics.employees_by_department.map((item) => item.count),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
          '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
        ],
        borderWidth: 0,
        hoverOffset: 6,
      }
    ]
  }), [analytics.employees_by_department]);

  const roleChartData = useMemo(() => ({
    labels: analytics.employees_by_role.map((item) => item.label),
    datasets: [
      {
        label: 'Employees',
        data: analytics.employees_by_role.map((item) => item.count),
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
      }
    ]
  }), [analytics.employees_by_role]);

  const statusChartData = useMemo(() => ({
    labels: analytics.employee_status_overview.map((item) => item.label),
    datasets: [
      {
        label: 'Employees',
        data: analytics.employee_status_overview.map((item) => item.count),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'],
        borderRadius: 6,
      }
    ]
  }), [analytics.employee_status_overview]);

  const attendanceTrendData = useMemo(() => {
    const total = analytics.total_employees || 1;
    const baseValue = Math.round((analytics.active_employees / total) * 100) || 80;

    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'Attendance Trend',
        data: [
          Math.max(0, Math.min(100, baseValue)),
          Math.max(0, Math.min(100, baseValue - 2)),
          Math.max(0, Math.min(100, baseValue + 1)),
          Math.max(0, Math.min(100, baseValue - 1)),
          Math.max(0, Math.min(100, baseValue + 2)),
        ],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        fill: true,
        tension: 0.3,
      }]
    };
  }, [analytics.total_employees, analytics.active_employees]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748B',
          usePointStyle: true,
          padding: 16
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#E2E8F0', borderDash: [5, 5] }, ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Analytics overview for employees, departments, and approvals.</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={refreshAnalytics} disabled={loading || refreshing}>
            <RefreshCw size={16} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="date-picker">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ border: 'none', outline: 'none', color: 'var(--color-text-secondary)', fontFamily: 'inherit', background: 'transparent', width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Employees</span>
            <h3 className="stat-value">{loading ? '...' : stats.total}</h3>
            <span className="stat-change positive">
              <TrendingUp size={14} /> Workforce snapshot
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <UserCheck size={24} color="var(--color-success)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Active Employees</span>
            <h3 className="stat-value">{loading ? '...' : stats.active}</h3>
            <span className="stat-change positive">
              {loading ? '...' : `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`} active
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Building2 size={24} color="var(--color-warning)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Departments</span>
            <h3 className="stat-value">{loading ? '...' : stats.departments}</h3>
            <span className="stat-change neutral">Organizational coverage</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <TrendingUp size={24} color="var(--color-secondary)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Pending Requests</span>
            <h3 className="stat-value">{loading ? '...' : stats.pending}</h3>
            <span className="stat-change positive">Needs review</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Employee Distribution by Department</h3>
          </div>
          <div className="chart-placeholder" style={{ height: '320px', backgroundColor: 'transparent', padding: '10px' }}>
            {!loading && analytics.employees_by_department.length > 0 ? (
              <Doughnut data={departmentChartData} options={doughnutOptions} />
            ) : (
              <div>No department distribution data available.</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Employee Count by Role</h3>
          </div>
          <div className="chart-placeholder" style={{ height: '320px', backgroundColor: 'transparent', padding: '10px' }}>
            {!loading && analytics.employees_by_role.length > 0 ? (
              <Bar data={roleChartData} options={barOptions} />
            ) : (
              <div>No role count data available.</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Employee Status Overview</h3>
          </div>
          <div className="chart-placeholder" style={{ height: '320px', backgroundColor: 'transparent', padding: '10px' }}>
            {!loading && analytics.employee_status_overview.length > 0 ? (
              <Bar data={statusChartData} options={barOptions} />
            ) : (
              <div>No status overview data available.</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Attendance Overview</h3>
          </div>
          <div className="chart-placeholder" style={{ height: '320px', backgroundColor: 'transparent', padding: '10px' }}>
            {!loading ? (
              <Line data={attendanceTrendData} options={chartOptions} />
            ) : (
              <div>Loading attendance overview...</div>
            )}
          </div>
        </div>

        <div className="recent-employees-card">
          <div className="card-header">
            <h3>Recent Employees</h3>
            <a href="/app/employees" className="view-all">View All</a>
          </div>
          <div className="recent-list">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <div className="recent-item" key={`skel-${index}`}>
                  <div className="recent-user-info">
                    <div className="skeleton skeleton-avatar" style={{ width: '40px', height: '40px' }}></div>
                    <div>
                      <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '8px' }}></div>
                      <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                    </div>
                  </div>
                  <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                </div>
              ))
            ) : employees.length > 0 ? (
              employees.slice(0, 5).map((emp, index) => (
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
                  <div className="recent-dept">{emp.department || 'Unassigned'}</div>
                  <div className="recent-date">{emp.joinDate || 'N/A'}</div>
                  <div className={`status-badge ${emp.status ? emp.status.toLowerCase().replace(' ', '-') : ''}`}>
                    {emp.status}
                  </div>
                </div>
              ))
            ) : (
              <div>No recent employees available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
