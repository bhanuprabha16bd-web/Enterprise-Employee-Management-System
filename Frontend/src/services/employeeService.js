import api from './api';

export const employeeService = {
  /**
   * Fetch all employees
   * @returns {Promise<Array>} List of employees
   */
  getEmployees: async () => {
    // Artificial delay to show off the cool skeleton loaders!
    await new Promise(resolve => setTimeout(resolve, 1500));
    const response = await api.get('/employees/');
    return response.data;
  },

  /**
   * Fetch a single employee by ID
   * @param {number} id Employee ID
   * @returns {Promise<Object>} Employee object
   */
  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  }
};
