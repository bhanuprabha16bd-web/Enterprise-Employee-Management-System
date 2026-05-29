import { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, CalendarCheck, Building2, TrendingUp, MoreHorizontal } from 'lucide-react';
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
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceFilter, setAttendanceFilter] = useState('this_week');
  const [departmentFilter, setDepartmentFilter] = useState('this_week');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching dashboard employees:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active').length;
    const departments = new Set(employees.map(e => e.department).filter(Boolean)).size;
    
    // Calculate department distribution
    const deptCounts = {};
    const statusCounts = { Active: 0, Inactive: 0, 'On Leave': 0 };
    
    employees.forEach(emp => {
      if (emp.department) {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
      }
      if (emp.status && statusCounts[emp.status] !== undefined) {
        statusCounts[emp.status] += 1;
      } else if (emp.status) {
        statusCounts[emp.status] = 1;
      }
    });

    return { total, active, departments, deptCounts, statusCounts };
  }, [employees]);

  // Chart Data
  const doughnutData = useMemo(() => {
    const labels = Object.keys(stats.deptCounts);
    let data = Object.values(stats.deptCounts);
    
    if (departmentFilter === 'this_month') {
      data = data.map((v, i) => Math.max(1, v + (i % 2 === 0 ? 1 : -1)));
    } else if (departmentFilter === 'this_year') {
      data = data.map((v, i) => Math.max(1, v + (i % 3 === 0 ? 2 : -1)));
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
            '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };
  }, [stats.deptCounts, departmentFilter]);

  const attendanceData = useMemo(() => {
    if (attendanceFilter === 'this_week') {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Attendance %',
          data: [92, 95, 89, 94, 91, 85, 88],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    } else if (attendanceFilter === 'this_month') {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Attendance %',
          data: [91, 93, 90, 94],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    } else {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Attendance %',
          data: [92, 90, 94, 95, 91, 93, 94, 96, 92, 91, 93, 95],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    }
  }, [attendanceFilter]);

  const barData = {
    labels: Object.keys(stats.statusCounts),
    datasets: [
      {
        label: 'Employees',
        data: Object.values(stats.statusCounts),
        backgroundColor: ['#10B981', '#94A3B8', '#F59E0B'],
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748B',
          usePointStyle: true,
          padding: 20
        }
      }
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
          <p className="page-subtitle">Welcome back, Admin! Here's your enterprise overview.</p>
        </div>
        <div className="date-picker">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ border: 'none', outline: 'none', color: 'var(--color-text-secondary)', fontFamily: 'inherit', background: 'transparent', width: '100%' }} 
          />
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
              <TrendingUp size={14} /> + 2 this week
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
              <TrendingUp size={14} /> {(stats.active / (stats.total || 1) * 100).toFixed(0)}% of total
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <CalendarCheck size={24} color="#8B5CF6" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Attendance Today</span>
            <h3 className="stat-value">92%</h3>
            <span className="stat-change positive">
              <TrendingUp size={14} /> + 1.2% from yesterday
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Building2 size={24} color="var(--color-warning)" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Departments</span>
            <h3 className="stat-value">{loading ? '...' : stats.departments}</h3>
            <span className="stat-change neutral">
              No change
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <div className="chart-card">
          <div className="card-header">
            <h3>Department Distribution</h3>
            <select 
              className="select-sm" 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
          <div className="chart-placeholder" style={{ height: '300px', backgroundColor: 'transparent', padding: '10px' }}>
            {!loading && <Doughnut data={doughnutData} options={chartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Employee Activity</h3>
          </div>
          <div className="chart-placeholder" style={{ height: '300px', backgroundColor: 'transparent', padding: '10px' }}>
             {!loading && <Bar data={barData} options={barOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Attendance Overview</h3>
            <select 
              className="select-sm" 
              value={attendanceFilter} 
              onChange={(e) => setAttendanceFilter(e.target.value)}
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
          <div className="chart-placeholder" style={{ height: '300px', backgroundColor: 'transparent', padding: '10px' }}>
             {!loading && <Line data={attendanceData} options={chartOptions} />}
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
            ) : employees.slice(0, 5).map((emp, index) => (
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
                <div className="recent-dept">{emp.department}</div>
                <div className="recent-date">{emp.joinDate || 'N/A'}</div>
                <div className={`status-badge ${emp.status ? emp.status.toLowerCase().replace(' ', '-') : ''}`}>
                  {emp.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
