import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-production-03bc.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const endpoints = {
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  reports: `${API_BASE_URL}/api/reports`,
  verifyAI: `${API_BASE_URL}/api/verify-ai`,
  aiChat: `${API_BASE_URL}/api/ai-chat`,
  articles: `${API_BASE_URL}/api/articles`,
  videos: `${API_BASE_URL}/api/videos`,
  sources: `${API_BASE_URL}/api/sources`,
  adminStats: `${API_BASE_URL}/api/admin/stats`,
  adminUsers: `${API_BASE_URL}/api/admin/users`,
};

export { api, API_BASE_URL };
export default api;
