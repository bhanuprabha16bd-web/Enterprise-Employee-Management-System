import api from './api';

/**
 * Export Service
 * Handles API calls related to data exports.
 */
export const exportService = {
  /**
   * Fetches the history of data exports.
   * @returns {Promise<Array>} List of export records.
   */
  getExportHistory: async () => {
    const response = await api.get('/export/history');
    return response.data;
  },

  /**
   * Downloads an exported file.
   * @param {string} entity - The entity to export.
   * @param {string} format - The export format.
   * @returns {Promise<Blob>} The file blob.
   */
  downloadExport: async (entity, format) => {
    const response = await api.get(`/export/download`, {
      params: { entity, format },
      responseType: 'blob', // crucial for downloading files
    });
    return response;
  }
};
