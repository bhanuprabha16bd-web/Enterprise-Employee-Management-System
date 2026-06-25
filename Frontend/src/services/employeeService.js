import api from './api';

const removeDuplicateNames = (employees) => {
  const seen = new Set();
  return employees.filter((employee) => {
    const normalizedName = employee.name?.trim().toLowerCase();
    if (!normalizedName || seen.has(normalizedName)) {
      return false;
    }
    seen.add(normalizedName);
    return true;
  });
};

/**
 * Employee Service
 * Handles API calls related to employees, departments, and company analytics.
 */
export const employeeService = {
  /**
   * Fetch all employees
   * @returns {Promise<Array>} List of employees
   */
  getEmployees: async () => {
    let localEmployees = [];
    try {
      // 1. Fetch newly added employees from your actual backend database
      const localResponse = await api.get('/employees/');
      localEmployees = localResponse.data || [];
    } catch (error) {
      console.warn('Could not fetch local employees', error);
    }

    // Remove duplicate employee names before returning the list
    return removeDuplicateNames(localEmployees);
  },

  /**
   * Fetch a single employee by ID
   * @param {number} id Employee ID
   * @returns {Promise<Object>} Employee object
   */
  getEmployeeById: async (id) => {
    if (typeof id === 'string' && (id.startsWith('old_') || id.startsWith('mock_'))) {
      return null; // Mock fetching by ID for jsonplaceholder if needed
    }
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Add a new employee
   * @param {Object} employeeData
   */
  addEmployee: async (employeeData) => {
    const response = await api.post('/employees/', employeeData);
    return response.data;
  },

  /**
   * Update an employee
   * @param {number} id
   * @param {Object} employeeData
   */
  updateEmployee: async (id, employeeData) => {
    if (typeof id === 'string' && (id.startsWith('old_') || id.startsWith('mock_'))) {
      return { id, ...employeeData };
    }
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  /**
   * Delete an employee
   * @param {number} id
   */
  deleteEmployee: async (id) => {
    if (typeof id === 'string' && (id.startsWith('old_') || id.startsWith('mock_'))) {
      return { message: "Employee deleted successfully" };
    }
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * Fetch all departments
   */
  getDepartments: async () => {
    const response = await api.get('/departments/');
    return response.data;
  },

  /**
   * Add a new department
   * @param {Object} departmentData
   */
  addDepartment: async (departmentData) => {
    const response = await api.post('/departments/', departmentData);
    return response.data;
  },

  /**
   * Fetch current company details
   */
  getCurrentCompany: async () => {
    try {
      const response = await api.get('/company/');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch current company:', error);
      return null;
    }
  },

  /**
   * Fetch dashboard analytics summary
   */
  getDashboardAnalytics: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  /**
   * Transfer an employee to a different department
   * @param {number} id Employee ID
   * @param {Object} transferData { to_department_id, reason }
   */
  transferEmployee: async (id, transferData) => {
    const response = await api.post(`/employees/${id}/transfer`, transferData);
    return response.data;
  },

  /**
   * Get department transfer history for an employee
   * @param {number} id Employee ID
   */
  getEmployeeTransfers: async (id) => {
    const response = await api.get(`/employees/${id}/transfers`);
    return response.data;
  }
};
