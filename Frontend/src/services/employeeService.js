import api from './api';

export const employeeService = {
  /**
   * Fetch all employees
   * @returns {Promise<Array>} List of employees
   */
  getEmployees: async () => {
    let localEmployees = [];
    try {
      const response = await api.get('/employees/');
      localEmployees = response.data || [];
    } catch (error) {
      console.warn('Could not fetch local employees, proceeding with old employees only', error);
    }

    try {
      const oldResponse = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!oldResponse.ok) {
         throw new Error(`HTTP error! status: ${oldResponse.status}`);
      }
      const oldUsers = await oldResponse.json();
      
      const statuses = ['Active', 'Inactive', 'On Leave'];
      const roles = ['Engineer', 'Associate', 'Manager', 'Analyst', 'Specialist', 'Director'];
      const departments = ['Engineering', 'Development', 'Sales', 'Marketing', 'Design', 'Human Resources', 'Product', 'Data'];

      const oldEmployees = oldUsers.map((user, index) => ({
        id: `old_${user.id}`,
        name: user.name,
        email: user.email,
        role: roles[index % roles.length],
        department: departments[index % departments.length],
        status: statuses[index % statuses.length],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        date: '2023-01-01',
      }));

      return [...localEmployees, ...oldEmployees];
    } catch (error) {
      console.error('Error fetching old employees:', error);
      return localEmployees;
    }
  },

  /**
   * Fetch a single employee by ID
   * @param {number} id Employee ID
   * @returns {Promise<Object>} Employee object
   */
  getEmployeeById: async (id) => {
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
   * Fetch all departments
   */
  getDepartments: async () => {
    const response = await api.get('/departments/');
    return response.data;
  }
};
