import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Calendar, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await response.json();
        
        const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];
        const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
        
        const mockLogs = users.map((user, i) => {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          let checkIn = '-';
          let checkOut = '-';
          let hours = '-';

          if (status === 'Present' || status === 'Late') {
            const startHr = status === 'Late' ? 9 + Math.floor(Math.random() * 2) : 8;
            const startMin = Math.floor(Math.random() * 60);
            const endHr = 17 + Math.floor(Math.random() * 2);
            const endMin = Math.floor(Math.random() * 60);
            
            checkIn = `${startHr.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} AM`;
            checkOut = `${(endHr - 12).toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')} PM`;
            hours = `${endHr - startHr}h ${Math.abs(endMin - startMin)}m`;
          }

          return {
            id: user.id,
            name: user.name,
            department: depts[i % depts.length],
            date: new Date().toISOString().split('T')[0],
            status,
            checkIn,
            checkOut,
            hours
          };
        });
        
        setAttendanceLogs(mockLogs);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'Present') return <CheckCircle2 size={16} color="var(--color-success)" />;
    if (status === 'Absent') return <XCircle size={16} color="var(--color-danger)" />;
    return <Clock size={16} color="var(--color-warning)" />;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Present') return 'badge-active';
    if (status === 'Absent') return 'badge-inactive';
    return 'badge-warning';
  };

  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceLogs, searchTerm, statusFilter]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredLogs, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDownloadCSV = () => {
    const headers = ['Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const csvContent = [
      headers.join(','),
      ...sortedLogs.map(log => 
        [
          `"${log.name}"`, 
          `"${log.department}"`, 
          `"${log.date}"`, 
          `"${log.checkIn}"`, 
          `"${log.checkOut}"`, 
          `"${log.hours}"`, 
          `"${log.status}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Log</h1>
          
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user?.role === 'Admin' && (
            <button 
              onClick={handleDownloadCSV} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'var(--color-primary, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              <Download size={18} />
              Export CSV
            </button>
          )}
          <div className="date-picker-large">
            <Calendar size={18} color="var(--color-text-secondary)" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="list-controls">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-select">
              <Filter size={16} className="filter-icon" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="emp-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Employee <ArrowUpDown size={14} className="sort-icon" />
                </th>
                <th onClick={() => handleSort('department')} className="sortable">
                  Department <ArrowUpDown size={14} className="sort-icon" />
                </th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Hours</th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status <ArrowUpDown size={14} className="sort-icon" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                </tr>
              ) : sortedLogs.length > 0 ? (
                sortedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="emp-cell-user">
                        <div className="avatar-sm">{log.name.charAt(0)}</div>
                        <div className="emp-name">{log.name}</div>
                      </div>
                    </td>
                    <td>{log.department}</td>
                    <td className="time-cell">{log.checkIn}</td>
                    <td className="time-cell">{log.checkOut}</td>
                    <td className="time-cell font-medium">{log.hours}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(log.status)}`} style={{ gap: '6px' }}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Calendar size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
                    <h3>No attendance records found</h3>
                    <p>Try adjusting your search filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
