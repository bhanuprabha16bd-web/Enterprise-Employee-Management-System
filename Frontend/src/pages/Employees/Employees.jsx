import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  UserCheck, 
  UserX,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  MapPin,
  X,
  ArrowUpDown
} from 'lucide-react';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(response => response.json())
      .then(data => {
        const departments = ['Engineering', 'Design', 'Human Resources', 'Product', 'Data', 'Marketing'];
        const roles = ['Frontend Developer', 'UI/UX Designer', 'HR Manager', 'Product Manager', 'Data Scientist', 'Marketing Specialist'];
        const statuses = ['Active', 'On Leave', 'Inactive'];
        
        const formattedData = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: roles[user.id % roles.length],
          department: departments[user.id % departments.length],
          status: statuses[user.id % statuses.length],
          joinDate: '2023-01-15',
          avatar: `https://i.pravatar.cc/150?u=${user.id}`,
          phone: user.phone,
          location: `${user.address.city}, ${user.address.zipcode}`
        }));
        setEmployees(formattedData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching employees:', error);
        setLoading(false);
      });
  }, []);

  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Active': return 'badge-active';
      case 'On Leave': return 'badge-warning';
      case 'Inactive': return 'badge-inactive';
      default: return 'badge-default';
    }
  };

  return (
    <div className="employees-page">
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members and their account permissions here.</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>
      <div className="employees-content">
        {/* Main Table Area */}
        <div className="employees-list-container">
          {/* Controls */}
          <div className="list-controls">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <div className="filter-select">
                <Filter size={16} className="filter-icon" />
                <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Product">Product</option>
                  <option value="Data">Data</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Employee <ArrowUpDown size={14} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role <ArrowUpDown size={14} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('department')} className="sortable">
                    Department <ArrowUpDown size={14} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status <ArrowUpDown size={14} className="sort-icon" />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map(emp => (
                  <tr 
                    key={emp.id} 
                    onClick={() => setSelectedEmployee(emp)}
                    className={selectedEmployee?.id === emp.id ? 'selected-row' : ''}
                  >
                    <td>
                      <div className="emp-cell-user">
                        <img src={emp.avatar} alt={emp.name} className="emp-avatar-sm" />
                        <div>
                          <div className="emp-name">{emp.name}</div>
                          <div className="emp-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Loading employees...
                    </td>
                  </tr>
                ) : sortedEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
          <div className="pagination">
            <span className="page-info">Showing 1 to {sortedEmployees.length} of {employees.length} entries</span>
            <div className="page-controls">
              <button className="btn-page" disabled><ChevronLeft size={16} /></button>
              <button className="btn-page active">1</button>
              <button className="btn-page">2</button>
              <button className="btn-page">3</button>
              <button className="btn-page"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        
        <div className={`profile-preview ${selectedEmployee ? 'open' : ''}`}>
          {selectedEmployee ? (
            <div className="profile-content">
              <div className="profile-header">
                <h3>Employee Profile</h3>
                <button className="btn-icon" onClick={() => setSelectedEmployee(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="profile-card">
                <div className="profile-avatar-lg-wrapper">
                  <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="profile-avatar-lg" />
                  <span className={`status-dot ${getStatusBadgeClass(selectedEmployee.status)}`}></span>
                </div>
                <h2>{selectedEmployee.name}</h2>
                <p className="profile-role">{selectedEmployee.role}</p>
                <div className="profile-actions">
                  <button className="btn-outline-primary">Message</button>
                  <button className="btn-primary">Edit Profile</button>
                </div>
              </div>

              <div className="profile-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'department' ? 'active' : ''}`}
                  onClick={() => setActiveTab('department')}
                >
                  Department
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'details' && (
                  <div className="details-section">
                    <div className="info-group">
                      <Mail size={16} className="info-icon" />
                      <div>
                        <label>Email</label>
                        <p>{selectedEmployee.email}</p>
                      </div>
                    </div>
                    <div className="info-group">
                      <Phone size={16} className="info-icon" />
                      <div>
                        <label>Phone</label>
                        <p>{selectedEmployee.phone}</p>
                      </div>
                    </div>
                    <div className="info-group">
                      <Calendar size={16} className="info-icon" />
                      <div>
                        <label>Join Date</label>
                        <p>{selectedEmployee.joinDate}</p>
                      </div>
                    </div>
                    <div className="info-group">
                      <MapPin size={16} className="info-icon" />
                      <div>
                        <label>Location</label>
                        <p>{selectedEmployee.location}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'department' && (
                  <div className="placeholder-section">
                    <div className="placeholder-icon"><Briefcase size={32} /></div>
                    <h4>Department Info</h4>
                    <p>Department structure, manager, and team members placeholder.</p>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="placeholder-section">
                    <div className="placeholder-icon"><Calendar size={32} /></div>
                    <h4>Attendance Records</h4>
                    <p>Recent leaves, attendance score, and history placeholder.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-profile">
              <div className="empty-icon-wrapper">
                <Users size={48} />
              </div>
              <h3>Select an Employee</h3>
              <p>Click on an employee row to view their detailed profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
