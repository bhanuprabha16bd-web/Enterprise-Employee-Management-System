import api from './api';

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

    try {
      // 2. Fetch mock employees from jsonplaceholder
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const users = await response.json();
      
      const statuses = ['Active', 'Inactive', 'On Leave'];
      const roles = ['Engineer', 'Associate', 'Manager', 'Analyst', 'Specialist', 'Director'];
      const departments = ['Engineering', 'Development', 'Sales', 'Marketing', 'Design', 'Human Resources', 'Product', 'Data'];

      const mockEmployees = users.map((user, index) => ({
        id: `mock_${user.id}`,
        name: user.name,
        email: user.email,
        role: roles[index % roles.length],
        department: departments[index % departments.length],
        status: statuses[index % statuses.length],
        phone: user.phone,
        location: user.address?.city,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        joinDate: '2023-01-01',
      }));

      // 3. Merge both lists together so newly added employees persist after refresh
      return [...localEmployees, ...mockEmployees];
    } catch (error) {
      console.error('Error fetching mock employees:', error);
      return localEmployees;
    }
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
  }
};
