import { useState, useEffect } from 'react';
import { Building2, Plus, Users, Search, MoreVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeService } from '../../services/employeeService';
import './Departments.css';

/**
 * Departments Component
 * Renders the departments page, allowing users to view a list of departments,
 * search through them, and add new departments. It also displays the number of employees in each department.
 */
const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  /**
   * Fetches the list of all employees to calculate department member counts.
   */
  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  /**
   * Calculates the number of employees belonging to a specific department.
   * @param {string} deptName - The name of the department.
   * @returns {number} The count of employees in the department.
   */
  const getMemberCount = (deptName) => {
    return employees.filter(emp => emp.department === deptName).length;
  };

  /**
   * Fetches the list of all departments from the server.
   */
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the submission of the form to add a new department.
   * @param {Event} e - The form submission event.
   */
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const added = await employeeService.addDepartment({ name: newDeptName });
      setDepartments([...departments, added]);
      setShowAddModal(false);
      setNewDeptName('');
      toast.success('Department created successfully!');
    } catch (err) {
      console.error('Error adding department:', err);
      toast.error('Failed to create department');
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="departments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="departments-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" color="var(--color-text-tertiary)" />
          <input 
            type="text" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="departments-grid">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div className="dept-card skeleton-card" key={i}>
              <div className="skeleton skeleton-icon" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '60%', height: '24px', marginTop: '16px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: '8px' }}></div>
            </div>
          ))
        ) : filteredDepts.length > 0 ? (
          filteredDepts.map((dept) => (
            <div className="dept-card" key={dept.id}>
              <div className="dept-card-header">
                <div className="dept-icon-wrapper">
                  <Building2 size={24} color="var(--color-primary)" />
                </div>
                <button className="icon-btn-sm">
                  <MoreVertical size={16} color="var(--color-text-secondary)" />
                </button>
              </div>
              <h3 className="dept-name">{dept.name}</h3>
              <div className="dept-stats">
                <div className="dept-stat">
                  <Users size={16} color="var(--color-text-tertiary)" />
                  <span>{getMemberCount(dept.name)} {getMemberCount(dept.name) === 1 ? 'Member' : 'Members'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <Building2 size={48} color="var(--color-text-tertiary)" />
            <h3>No departments found</h3>
            <p>Try adjusting your search or add a new department.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add New Department</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="add-form">
              <div className="form-group">
                <label>Department Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Engineering"
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline-primary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
