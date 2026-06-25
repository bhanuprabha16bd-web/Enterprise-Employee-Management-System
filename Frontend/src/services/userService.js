import api from './api';

/**
 * User Service
 * Handles API calls related to user management, invitations, and status changes.
 */
export const userService = {
  /**
   * Fetches all users.
   * @returns {Promise<Array>} List of users.
   */
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data || [];
  },

  getInvitations: async () => {
    const response = await api.get('/users/invitations');
    return response.data || [];
  },

  createInvitation: async (invitationData) => {
    const response = await api.post('/users/invitations', invitationData);
    return response.data;
  },

  revokeInvitation: async (invitationId) => {
    const response = await api.delete(`/users/invitations/${invitationId}`);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.put(`/users/${userId}/deactivate`);
    return response.data;
  },

  suspendUser: async (email, reason) => {
    const response = await api.put(`/users/${email}/suspend`, { reason });
    return response.data;
  },

  verifyInvitation: async (token) => {
    const response = await api.get(`/users/invitations/verify/${token}`);
    return response.data;
  },
};
