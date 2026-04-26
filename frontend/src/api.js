import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const endpoints = {
  dashboard: '/dashboard/stats',
  reports: '/reports',
  reportsWithReviews: '/reports-with-reviews',
  reviewReports: '/review/reports',
  search: '/search',
  articles: '/articles',
  sources: '/sources',
  externalLinks: '/external-links',
  verifyAi: '/verify-ai',
  aiChat: '/ai-chat',
};
