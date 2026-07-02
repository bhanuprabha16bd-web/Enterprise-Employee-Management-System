import api from './api';

export const holidayService = {
  getHolidays: async (year = null, month = null) => {
    let url = '/holidays';
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getHolidayToday: async () => {
    const response = await api.get('/holidays/today');
    return response.data;
  },

  createHoliday: async (holidayData) => {
    const response = await api.post('/holidays', holidayData);
    return response.data;
  },

  updateHoliday: async (id, holidayData) => {
    const response = await api.put(`/holidays/${id}`, holidayData);
    return response.data;
  },

  deleteHoliday: async (id) => {
    const response = await api.delete(`/holidays/${id}`);
    return response.data;
  }
};
