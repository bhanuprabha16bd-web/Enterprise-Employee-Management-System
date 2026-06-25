import api from './api';

/**
 * Audit Service
 * Handles API calls related to audit logs.
 */
export const auditService = {
  /**
   * Fetches all audit logs.
   * @returns {Promise<Array>} List of audit logs.
   */
  getAuditLogs: async () => {
    const response = await api.get('/audit-logs/');
    return response.data;
  },
};
