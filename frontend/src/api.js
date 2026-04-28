import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-production-03bc.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

export const endpoints = {
  login:     '/api/login',
  register:  '/api/register',
  reports:   '/api/reports',
  articles:  '/api/articles',
  videos:    '/api/videos',
  verifyAI:  '/api/verify-ai',
  aiChat:    '/api/ai-chat',
  dashboard: '/api/dashboard',
  sources:   '/api/sources',
  adminUsers:'/api/admin/users',
};

export { api, API_BASE_URL };
export default api;
