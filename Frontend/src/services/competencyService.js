import api from './api';

export const competencyService = {
  getProfile: async (employeeId) => {
    const response = await api.get(`/competencies/employees/${employeeId}/profile`);
    return response.data;
  },
  listCompanyProfiles: async (params = {}) => {
    const response = await api.get('/competencies/company', { params });
    return response.data;
  },
  addSkill: async (employeeId, payload) => {
    const response = await api.post(`/competencies/employees/${employeeId}/skills`, payload);
    return response.data;
  },
  updateSkill: async (employeeId, skillId, payload) => {
    const response = await api.put(`/competencies/employees/${employeeId}/skills/${skillId}`, payload);
    return response.data;
  },
  deleteSkill: async (employeeId, skillId) => {
    const response = await api.delete(`/competencies/employees/${employeeId}/skills/${skillId}`);
    return response.data;
  },
  addCertification: async (employeeId, data) => {
    const formData = new FormData();
    const { file, ...payload } = data;
    formData.append('payload', JSON.stringify(payload));
    if (file) {
      formData.append('file', file);
    }
    const response = await api.post(`/competencies/employees/${employeeId}/certifications`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updateCertification: async (employeeId, certificationId, data) => {
    const formData = new FormData();
    const { file, ...payload } = data;
    formData.append('payload', JSON.stringify(payload));
    if (file) {
      formData.append('file', file);
    }
    const response = await api.put(`/competencies/employees/${employeeId}/certifications/${certificationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteCertification: async (employeeId, certificationId) => {
    const response = await api.delete(`/competencies/employees/${employeeId}/certifications/${certificationId}`);
    return response.data;
  },
};
