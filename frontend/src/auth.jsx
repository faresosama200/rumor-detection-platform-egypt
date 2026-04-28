import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/login', { email, password });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('token', data.token);
      return data.user;
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'فشل تسجيل الدخول';
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/api/register', { name, email, password });
      return data;
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'فشل إنشاء الحساب';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isReviewer: user?.role === 'reviewer' || user?.role === 'admin',
    isSpokesperson: user?.role === 'spokesperson',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
