import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    const name  = localStorage.getItem('name');
    if (token) setUser({ token, role, name });
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/login', { email, password });
    const { token, role, name, userId } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('role',  role);
    localStorage.setItem('name',  name);
    localStorage.setItem('userId', userId);
    setUser({ token, role, name, userId });
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/register', { name, email, password });
    return res.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
