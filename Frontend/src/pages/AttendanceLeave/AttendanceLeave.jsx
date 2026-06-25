import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarCheck, Plane, Calendar, Plus, CheckCircle2, XCircle, Clock, Search, Filter, ArrowUpDown, Download, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AttendanceLeave.css';

/**
 * AttendanceLeave Component.
 * Provides a unified interface for managing both Attendance and Leave requests.
 * Admins can view and approve requests for all users. Regular users can manage their own requests.
 */
const AttendanceLeave = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const { user } = useAuth();
  
  // --- LEAVE STATE ---
  const [leaves, setLeaves] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'Vacation',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');

  // --- ATTENDANCE STATE ---
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // --- ACCESS REQUEST STATE ---
  const [accessRequestStatus, setAccessRequestStatus] = useState(null);

  useEffect(() => {
    if (user?.role === 'Admin' || user?.attendance_access) return;
    
    /**
     * Checks if the current non-admin user has access to the attendance tab.
     * Fetches the status of their access request from the backend.
     */
    const fetchAccessStatus = async () => {
      try {
        const res = await api.get('/users/attendance-requests/me');
        setAccessRequestStatus(res.data.status);
      } catch (err) {
        if (err.response?.status === 404) {
          setAccessRequestStatus('None');
        } else {
          setAccessRequestStatus('Error');
        }
      }
    };
    fetchAccessStatus();
  }, [user]);

  /**
   * Submits a request to the admin for attendance tab access.
   * Updates local state to 'Pending' upon success.
   */
  const handleRequestAccess = async () => {
    try {
      await api.post('/users/attendance-requests');
      setAccessRequestStatus('Pending');
      toast.success('Access request sent to admin');
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  // --- LEAVE EFFECTS & FUNCTIONS ---
  /**
   * Fetches leave requests based on user role.
   * Admins retrieve all company leave requests, while regular users retrieve only their own.
   */
  const fetchLeaves = useCallback(async () => {
    if (user?.role !== 'Admin' && !user?.attendance_access) {
      setLeaveLoading(false);
      return;
    }
    try {
      setLeaveLoading(true);
      const url = user?.role === 'Admin' ? '/leaves/admin' : '/leaves/me';
      const res = await api.get(url);
      setLeaves(res.data);
    } catch {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLeaveLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const shouldFetchLeaves =
      activeTab === 'leave' ||
      (activeTab === 'attendance' && user?.role !== 'Admin');

    if (shouldFetchLeaves) {
      const timerId = window.setTimeout(fetchLeaves, 0);
      return () => window.clearTimeout(timerId);
    }
  }, [activeTab, fetchLeaves, user?.role]);

  /**
   * Handles leave management by allowing admins to approve or reject a leave request.
   * Refetches leave requests to update the UI after a successful action.
   */
  const handleAction = async (id, status) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      fetchLeaves();
    } catch {
      toast.error('Failed to update status');
    }
  };

  /**
   * Submits a new leave request for the current user.
   * Closes the modal and refreshes the leave list on success.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({ leave_type: 'Vacation', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch {
      toast.error('Failed to submit request');
    }
  };

  const leaveStats = useMemo(() => {
    if (!leaves || leaves.length === 0) return { pending: 0, approved: 0, rejected: 0 };
    return leaves.reduce((acc, leave) => {
      if (leave.status === 'Pending') acc.pending++;
      else if (leave.status === 'Approved') acc.approved++;
      else if (leave.status === 'Rejected') acc.rejected++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => leaveStatusFilter === 'All' || leave.status === leaveStatusFilter);
  }, [leaves, leaveStatusFilter]);

  // --- ATTENDANCE EFFECTS & FUNCTIONS ---
  useEffect(() => {
    if (activeTab !== 'attendance') return;
    if (user?.role !== 'Admin' && !user?.attendance_access) {
      setAttendanceLoading(false);
      return;
    }

    /**
     * Fetches all attendance logs for admins to monitor company-wide attendance.
     */
    const fetchAdminLogs = async () => {
      try {
        setAttendanceLoading(true);
        const res = await api.get('/attendance/admin');
        setAttendanceLogs(res.data || []);
      } catch (error) {
        console.error("Failed to fetch admin logs", error);
        toast.error("Failed to fetch attendance logs");
      } finally {
        setAttendanceLoading(false);
      }
    };

    /**
     * Fetches the current user's today's attendance and historical attendance logs.
     */
    const fetchUserLogs = async () => {
      try {
        setAttendanceLoading(true);
        const [todayRes, historyRes] = await Promise.all([
          api.get('/attendance/me/today'),
          api.get('/attendance/me/history')
        ]);
        setTodayLog(todayRes.data);
        setAttendanceLogs(historyRes.data || []);
      } catch (error) {
        console.error("Failed to fetch user logs", error);
        toast.error("Failed to fetch attendance logs");
      } finally {
        setAttendanceLoading(false);
      }
    };
    
    if (user?.role === 'Admin') {
      fetchAdminLogs();
    } else {
      fetchUserLogs();
    }
  }, [user?.role, activeTab]);

  /**
   * Records the user's check-in time for today's attendance.
   * Updates the UI to show the user as 'Present' or currently working.
   */
  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/check-in');
      setTodayLog(res.data);
      setAttendanceLogs(prev => [res.data, ...prev]);
      toast.success("Checked in successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to check in");
    }
  };

  /**
   * Records the user's check-out time for today's attendance.
   * Calculates total hours worked and updates the attendance log.
   */
  const handleCheckOut = async () => {
    try {
      const res = await api.put('/attendance/check-out');
      setTodayLog(res.data);
      setAttendanceLogs(prev => prev.map(log => log.id === res.data.id ? res.data : log));
      toast.success("Checked out successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to check out");
    }
  };

  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      const nameMatch = log.user_name ? log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const statusMatch = statusFilter === 'All' || log.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [attendanceLogs, searchTerm, statusFilter]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (!valA) valA = '';
      if (!valB) valB = '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLogs, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownloadCSV = () => {
    const headers = user?.role === 'Admin' 
      ? ['Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'] 
      : ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
      
    const csvContent = [
      headers.join(','),
      ...sortedLogs.map(log => {
        if (user?.role === 'Admin') {
          return `"${log.user_name || 'Unknown'}","${log.department || 'Unassigned'}","${log.date}","${formatTime(log.check_in_time)}","${formatTime(log.check_out_time)}","${log.total_hours || '-'}","${log.status}"`;
        }
        return `"${log.date}","${formatTime(log.check_in_time)}","${formatTime(log.check_out_time)}","${log.total_hours || '-'}","${log.status}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shared Helpers
  const getStatusIcon = (status) => {
    if (status === 'Approved' || status === 'Present') return <CheckCircle2 size={16} color="var(--color-success)" />;
    if (status === 'Rejected' || status === 'Absent') return <XCircle size={16} color="var(--color-danger)" />;
    return <Clock size={16} color="var(--color-warning)" />;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Approved' || status === 'Present') return 'badge-active';
    if (status === 'Rejected' || status === 'Absent') return 'badge-inactive';
    return 'badge-warning';
  };

  const renderTodayAttendanceCard = () => {
    const checkedIn = Boolean(todayLog);
    const checkedOut = Boolean(todayLog?.check_out_time);

    return (
      <section className="daily-request-card attendance-today-card">
        <div className="daily-card-title">
          <CalendarCheck size={18} />
          <div>
            <h2>Today's Attendance</h2>
            <p>{user?.name || 'User'} &middot; {user?.department || 'General Department'}</p>
          </div>
        </div>

        <div className={`attendance-strip ${checkedIn ? 'present' : 'pending'}`}>
          {checkedIn ? 'Present' : 'Not checked in'}
        </div>

        <div className="attendance-today-copy">
          {checkedIn ? (
            <>
              <p>Checked in at {formatTime(todayLog.check_in_time)}</p>
              {checkedOut ? (
                <p className="status-complete">Checked out at {formatTime(todayLog.check_out_time)} ({todayLog.total_hours} hrs)</p>
              ) : (
                <p className="status-working">Currently working</p>
              )}
            </>
          ) : (
            <p>Not checked in</p>
          )}
        </div>

        <div className="attendance-inline-actions">
          <button onClick={handleCheckIn} className="btn-primary" disabled={checkedIn}>
            <LogIn size={18} /> Check In
          </button>
          <button onClick={handleCheckOut} className="btn-outline-primary" disabled={!checkedIn || checkedOut}>
            <LogOut size={18} /> Check Out
          </button>
        </div>
      </section>
    );
  };

  const renderInlineLeaveRequestForm = () => (
    <section className="daily-request-card request-leave-card">
      <h2>Request Leave</h2>
      <form onSubmit={handleSubmit} className="inline-leave-form">
        <div className="inline-form-grid">
          <div className="inline-form-field">
            <label>Leave type</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              required
            >
              <option value="Vacation">Vacation</option>
              <option value="Medical">Medical</option>
            </select>
          </div>
          <div className="inline-form-field">
            <label>Start date</label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="inline-form-field">
            <label>End date</label>
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="inline-form-field">
          <label>Reason (optional)</label>
          <textarea
            rows="3"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Brief reason for your leave request"
          ></textarea>
        </div>

        <button type="submit" className="btn-primary inline-submit-btn">
          Submit Leave Request
        </button>
      </form>
    </section>
  );

  const renderAttendanceContent = () => {
    return (
      <div className="attendance-page attendance-page-spaced">
        <div className="page-header">
          <div className="attendance-hero compact">
            <h1 className="page-title">{user?.role === 'Admin' ? 'Company Attendance' : 'Attendance'}</h1>
            <p>Check in/out for today and submit leave requests for admin approval.</p>
          </div>
          <div className="page-actions">
            <button onClick={handleDownloadCSV} className="btn-primary">
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {user?.role !== 'Admin' && (
          <div className="attendance-request-grid">
            {renderTodayAttendanceCard()}
            {renderInlineLeaveRequestForm()}
          </div>
        )}

        <div className="table-card">
          {user?.role === 'Admin' && (
            <div className="list-controls">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="filter-select filter-select-inline">
                <Filter size={16} className="filter-icon" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  {user?.role === 'Admin' && (
                    <>
                      <th onClick={() => handleSort('user_name')} className="sortable">Employee <ArrowUpDown size={14} className="sort-icon" /></th>
                      <th onClick={() => handleSort('department')} className="sortable">Department <ArrowUpDown size={14} className="sort-icon" /></th>
                    </>
                  )}
                  <th onClick={() => handleSort('date')} className="sortable">Date <ArrowUpDown size={14} className="sort-icon" /></th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Total Hours</th>
                  <th onClick={() => handleSort('status')} className="sortable">Status <ArrowUpDown size={14} className="sort-icon" /></th>
                </tr>
              </thead>
              <tbody>
                {attendanceLoading ? (
                  <tr><td colSpan={user?.role === 'Admin' ? 7 : 5} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : sortedLogs.length > 0 ? (
                  sortedLogs.map((log) => (
                    <tr key={log.id}>
                      {user?.role === 'Admin' && (
                        <>
                          <td>
                            <div className="emp-cell-user">
                              <div className="avatar-sm">{(log.user_name || '?').charAt(0)}</div>
                              <div className="emp-name">{log.user_name || 'Unknown User'}</div>
                            </div>
                          </td>
                          <td>{log.department || 'Unassigned'}</td>
                        </>
                      )}
                      <td className="font-medium">{log.date}</td>
                      <td className="time-cell">{formatTime(log.check_in_time)}</td>
                      <td className="time-cell">{formatTime(log.check_out_time)}</td>
                      <td className="time-cell font-medium">{log.total_hours ? `${log.total_hours}h` : '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(log.status)}`}>
                          {getStatusIcon(log.status)}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user?.role === 'Admin' ? 7 : 5} className="empty-state">
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

        {user?.role !== 'Admin' && renderMyLeaveRequestsSection()}
      </div>
    );
  };

  const renderMyLeaveRequestsSection = () => {
    return (
      <div className="table-card leave-requests-card">
        <div className="section-title-row">
          <h2>My Leave Requests</h2>
        </div>
        <div className="table-wrapper">
          <table className="emp-table leave-requests-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveLoading ? (
                <tr>
                  <td colSpan="4" className="table-message">Loading leave requests...</td>
                </tr>
              ) : filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td className="font-medium">{leave.leave_type}</td>
                    <td>{leave.start_date} &rarr; {leave.end_date}</td>
                    <td>
                      <span className={`leave-status-text ${leave.status?.toLowerCase() || ''}`}>
                        {leave.status?.toLowerCase() || '-'}
                      </span>
                    </td>
                    <td>{leave.reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="table-message">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLeaveContent = () => {
    return (
      <div className="leave-page attendance-page-spaced">
        <div className="page-header">
          <div className="attendance-hero compact">
            <h1 className="page-title">{user?.role === 'Admin' ? 'Company Leaves' : 'Leave Requests'}</h1>
            <p>Submit leave requests and track approval status.</p>
          </div>
          {user?.role !== 'Admin' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={18} /> New Request
            </button>
          )}
        </div>

        {user?.role !== 'Admin' && (
          <div className="leave-stats-grid">
            <div className="leave-stat-card">
              <h3>Approved</h3>
              <p className="stat-success">{leaveStats.approved}</p>
            </div>
            <div className="leave-stat-card">
              <h3>Pending</h3>
              <p className="stat-warning">{leaveStats.pending}</p>
            </div>
            <div className="leave-stat-card">
              <h3>Rejected</h3>
              <p className="stat-danger">{leaveStats.rejected}</p>
            </div>
          </div>
        )}

        <div className="table-card">
          <div className="list-controls" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div className="filter-select" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <Filter size={16} className="filter-icon" />
              <select value={leaveStatusFilter} onChange={(e) => setLeaveStatusFilter(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent' }}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  {user?.role === 'Admin' && (
                    <>
                      <th>Employee</th>
                      <th>Department</th>
                    </>
                  )}
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {user?.role === 'Admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaveLoading ? (
                  <tr>
                    <td colSpan={user?.role === 'Admin' ? 7 : 4} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                  </tr>
                ) : filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id}>
                      {user?.role === 'Admin' && (
                        <>
                          <td>
                            <div className="emp-cell-user">
                              <div className="avatar-sm">{(leave.user_name || '?').charAt(0)}</div>
                              <div className="emp-name">{leave.user_name || 'Unknown User'}</div>
                            </div>
                          </td>
                          <td>{leave.department || 'Unassigned'}</td>
                        </>
                      )}
                      <td className="font-medium">{leave.leave_type}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                          <span>{leave.start_date} to</span>
                          <span>{leave.end_date}</span>
                        </div>
                      </td>
                      <td><div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>{leave.reason || '-'}</div></td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(leave.status)}`} style={{ gap: '6px' }}>
                          {getStatusIcon(leave.status)}
                          {leave.status}
                        </span>
                      </td>
                      {user?.role === 'Admin' && (
                        <td>
                          {leave.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleAction(leave.id, 'Approved')} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => handleAction(leave.id, 'Rejected')} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user?.role === 'Admin' ? 7 : 4} className="empty-state">
                      <Calendar size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
                      <h3>No leave requests found</h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '400px' }}>
              <div className="modal-header">
                <h2>Submit Leave Request</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Leave Type</label>
                  <select 
                    value={formData.leave_type} 
                    onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="Vacation">Vacation</option>
                    <option value="Medical">Medical</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Start Date</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>End Date</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Reason (Optional)</label>
                  <textarea 
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', resize: 'none', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-primary)' }}
                    placeholder="Explain your leave request..."
                  ></textarea>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (user?.role !== 'Admin' && !user?.attendance_access) {
    return (
      <div className="attendance-leave-container attendance-page-spaced" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="empty-state table-card" style={{ padding: '40px', textAlign: 'center', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <Clock size={48} color="var(--color-warning)" style={{ marginBottom: '16px', display: 'inline-block' }} />
          <h2 style={{ marginBottom: '8px' }}>Access Pending</h2>
          {accessRequestStatus === 'Pending' ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Your request is pending admin approval.</p>
          ) : accessRequestStatus === 'Rejected' ? (
            <>
              <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>Your access request was rejected.</p>
              <button onClick={handleRequestAccess} className="btn-primary">Request Again</button>
            </>
          ) : accessRequestStatus === 'None' ? (
            <>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>You need admin approval to view attendance.</p>
              <button onClick={handleRequestAccess} className="btn-primary">Request Access</button>
            </>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)' }}>Checking access status...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-leave-container">
      {user?.role === 'Admin' && (
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
          >
            <CalendarCheck size={18} /> Attendance
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`}
          >
            <Plane size={18} /> Leave
          </button>
        </div>
      )}

      <div className="tab-content">
        {activeTab === 'attendance' && renderAttendanceContent()}
        {activeTab === 'leave' && renderLeaveContent()}
      </div>
    </div>
  );
};

export default AttendanceLeave;
