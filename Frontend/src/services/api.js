import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

// Response interceptor for generic error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;
