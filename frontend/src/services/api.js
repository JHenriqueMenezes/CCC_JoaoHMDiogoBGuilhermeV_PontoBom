import axios from 'axios';

const API_BASE = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
});

export const imgUrl = (path) => (path ? `${API_BASE}${path}` : null);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
