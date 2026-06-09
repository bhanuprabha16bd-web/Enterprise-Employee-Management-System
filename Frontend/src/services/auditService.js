import api from './api';

export const auditService = {
  getAuditLogs: async () => {
    const response = await api.get('/audit-logs/');
    return response.data;
  },
};
