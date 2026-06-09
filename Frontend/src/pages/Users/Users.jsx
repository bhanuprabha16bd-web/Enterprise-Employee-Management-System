import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Users as UsersIcon, 
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
import './Users.css';
import { employeeService } from '../../services/employeeService';
import { useNotification } from '../../context/NotificationContext';

const Users = () => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '', email: '', role: '', department_id: '',
    status: 'Active', phone: '', location: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [touchedFields, setTouchedFields] = useState({});

  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empData, deptData, companyData] = await Promise.all([
  employeeService.getEmployees(),
  employeeService.getDepartments(),
  employeeService.getCurrentCompany()
]);

setEmployees(empData);
setDepartments(deptData);
setCurrentCompany(companyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
  // The backend API already filters local employees by company_id to enforce data isolation.
  // Mock employees from jsonplaceholder do not have a companyId, so we will display them as is.
  const companyEmployees = sortedEmployees;

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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const empData = {
  ...newEmployee,
  department_id: parseInt(newEmployee.department_id),
  companyId: currentCompany?.id
};
      const added = await employeeService.addEmployee(empData);
      setEmployees([...employees, added]);
      setShowAddModal(false);
      setTouchedFields({});
      setNewEmployee({
        name: '', email: '', role: '', department_id: '',
        status: 'Active', phone: '', location: '',
        joinDate: new Date().toISOString().split('T')[0]
      });
      addNotification(`New employee added: ${empData.name}`);
      toast.success('Employee added successfully');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleEditClick = (emp) => {
    const dept = departments.find(d => d.name === emp.department);
    setEditEmployee({
      ...emp,
      department_id: dept ? dept.id : ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const empData = {
  name: editEmployee.name,
  email: editEmployee.email,
  role: editEmployee.role,
  department_id: parseInt(editEmployee.department_id),
  status: editEmployee.status,
  phone: editEmployee.phone,
  location: editEmployee.location,
  joinDate: editEmployee.joinDate,
  companyId: currentCompany?.id
};
      const updated = await employeeService.updateEmployee(editEmployee.id, empData);
      setEmployees(employees.map(emp => emp.id === updated.id ? updated : emp));
      setSelectedEmployee(updated);
      setShowEditModal(false);
      addNotification(`Employee profile updated: ${updated.name}`);
      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await employeeService.deleteEmployee(selectedEmployee.id);
      addNotification(`Employee deleted: ${selectedEmployee.name}`);
      setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id));
      setSelectedEmployee(null);
      setShowDeleteModal(false);
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const handleStatusChange = async (emp, newStatus) => {
    try {
      const updated = await employeeService.updateEmployee(emp.id, { ...emp, status: newStatus });
      setEmployees(employees.map(e => e.id === updated.id ? updated : e));
      if (selectedEmployee && selectedEmployee.id === updated.id) {
        setSelectedEmployee(updated);
      }
      addNotification(`Status changed to ${newStatus} for ${emp.name}`);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const isDuplicateEmployeeName = (name) => {
    const normalizedName = name.trim().toLowerCase();
    return employees.some(emp => emp.name?.trim().toLowerCase() === normalizedName);
  };

  const validateAddForm = () => {
    const errs = {};
    if (!newEmployee.name.trim()) {
      errs.name = 'Name is required';
    } else if (isDuplicateEmployeeName(newEmployee.name)) {
      errs.name = 'An employee with this name already exists';
    }
    if (!newEmployee.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email)) {
      errs.email = 'Invalid email format';
    }
    if (!newEmployee.role.trim()) errs.role = 'Role is required';
    if (!newEmployee.department_id) errs.department = 'Department is required';
    return errs;
  };

  const addErrors = showAddModal ? validateAddForm() : {};
  const isAddValid = Object.keys(addErrors).length === 0;

  const handleBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setTouchedFields({});
    setNewEmployee({
      name: '', email: '', role: '', department_id: '',
      status: 'Active', phone: '', location: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="employees-page">
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          

{currentCompany && (
  <div className="company-badge">
    Workspace: {currentCompany.name}
  </div>
)}
        </div>
        <button className="btn-primary" onClick={() => { setShowAddModal(true); setTouchedFields({}); }}>
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>
      <div className="employees-content">
        
        <div className="employees-list-container">
          
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
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
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
                  <th onClick={() => handleSort('role')} className="sortable">
                    Role <ArrowUpDown size={14} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('department')} className="sortable">
  Department
</th>

<th>
  Company
</th>

<th onClick={() => handleSort('status')} className="sortable">
  Status
</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyEmployees.map(emp => (
                  <tr 
                    key={emp.id} 
                    onClick={() => setSelectedEmployee(emp)}
                    className={selectedEmployee?.id === emp.id ? 'selected-row' : ''}
                  >
                    <td>
                      <div className="emp-cell-user">
                        <img src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} className="emp-avatar-sm" />
                        <div>
                          <div className="emp-name">{emp.name}</div>
                          <div className="emp-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>

<td>
  <span className="company-tag">
    {emp.companyName || currentCompany?.name}
  </span>
</td>

<td onClick={(e) => e.stopPropagation()}>
                      <select 
                        className={`status-dropdown ${getStatusBadgeClass(emp.status)}`}
                        value={emp.status}
                        onChange={(e) => handleStatusChange(emp, e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Leave">Leave</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn-icon">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={`skeleton-${index}`} className="skeleton-row">
                      <td>
                        <div className="emp-cell-user">
                          <div className="skeleton skeleton-avatar"></div>
                          <div>
                            <div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: '8px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
                          </div>
                        </div>
                      </td>
                      <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '80px', borderRadius: '12px' }}></div></td>
                      <td><div className="skeleton skeleton-icon"></div></td>
                    </tr>
                  ))
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
  <span className="page-info">
    Showing 1 to {companyEmployees.length} of {companyEmployees.length} employees
  </span>

  <div className="page-controls">
    <button className="btn-page" disabled>
      <ChevronLeft size={16} />
    </button>
    <button className="btn-page active">1</button>
    <button className="btn-page">2</button>
    <button className="btn-page">3</button>
    <button className="btn-page">
      <ChevronRight size={16} />
    </button>
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
                  <img src={selectedEmployee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.name)}&background=random`} alt={selectedEmployee.name} className="profile-avatar-lg" />
                  <span className={`status-dot ${getStatusBadgeClass(selectedEmployee.status)}`}></span>
                </div>
                <h2>{selectedEmployee.name}</h2>
                <p className="profile-role">{selectedEmployee.role}</p>
                <div className="profile-actions">
                  <button className="btn-outline-primary" onClick={() => handleEditClick(selectedEmployee)}>Edit Profile</button>
                  <button className="btn-primary" style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => setShowDeleteModal(true)}>Delete</button>
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
                <UsersIcon size={48} />
              </div>
              <h3>Select an Employee</h3>
              <p>Click on an employee row to view their detailed profile.</p>
            </div>
          )}
        </div>
      </div>

    {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="btn-icon" onClick={handleCloseAddModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="add-employee-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} onBlur={() => handleBlur('name')} />
                {touchedFields.name && addErrors.name && <span className="error-text" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>{addErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} onBlur={() => handleBlur('email')} />
                {touchedFields.email && addErrors.email && <span className="error-text" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>{addErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" required value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} onBlur={() => handleBlur('role')} />
                {touchedFields.role && addErrors.role && <span className="error-text" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>{addErrors.role}</span>}
              </div>
              <div className="form-group">
                <label>Department</label>
                <select required value={newEmployee.department_id} onChange={e => setNewEmployee({...newEmployee, department_id: e.target.value})} onBlur={() => handleBlur('department')}>
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {touchedFields.department && addErrors.department && <span className="error-text" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>{addErrors.department}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={newEmployee.location} onChange={e => setNewEmployee({...newEmployee, location: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline-primary" onClick={handleCloseAddModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!isAddValid} style={{ opacity: !isAddValid ? 0.5 : 1, cursor: !isAddValid ? 'not-allowed' : 'pointer' }}>Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="add-employee-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" required value={editEmployee.name || ''} onChange={e => setEditEmployee({...editEmployee, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required value={editEmployee.email || ''} onChange={e => setEditEmployee({...editEmployee, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" required value={editEmployee.role || ''} onChange={e => setEditEmployee({...editEmployee, role: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select required value={editEmployee.department_id || ''} onChange={e => setEditEmployee({...editEmployee, department_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select required value={editEmployee.status || ''} onChange={e => setEditEmployee({...editEmployee, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={editEmployee.phone || ''} onChange={e => setEditEmployee({...editEmployee, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={editEmployee.location || ''} onChange={e => setEditEmployee({...editEmployee, location: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline-primary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 0' }}>
              <p>Are you sure you want to delete <strong>{selectedEmployee?.name}</strong>?</p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-outline-primary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
