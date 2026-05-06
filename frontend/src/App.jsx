import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login               from './Login';
import Register            from './Register';
import AdminDashboard      from './AdminDashboard';
import AIChat              from './AIChat';
import AdvancedAIDetection from './AdvancedAIDetection';
import ArticlesPage        from './ArticlesData';
import HomePage            from './HomePage';
import AwarenessSectionPage from './AwarenessSectionPage';
import VideoAwareness      from './VideoAwareness';
import AdminArticles       from './AdminArticles';
import ReportPage          from './ReportPage';
import AdminReports        from './AdminReports';
import AdminUsers          from './AdminUsers';
import MinistriesPage      from './MinistriesPage';
import Sidebar             from './Sidebar';
import { useAuth }         from './auth';
import AppIcon             from './AppIcon';
import './styles.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout }     = useAuth();
  const navigate                      = useNavigate();
  const location                      = useLocation();

  const isAuth  = !!user?.token;
  const isAdmin = user?.role === 'admin';
  const hideNav = location.pathname === '/login' || location.pathname === '/register';

  if (loading) return (
    <div className="splash-screen">
      <div className="splash-logo"><AppIcon name="shield" size={56} /></div>
      <p>منصة مكافحة الشائعات</p>
    </div>
  );

  return (
    <div className="app-root">
      {/* Header */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="top-bar-start">
            {!hideNav && (
              <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="القائمة">
                <AppIcon name={sidebarOpen ? 'close' : 'menu'} size={18} />
              </button>
            )}
            <div className="brand" onClick={() => navigate('/home')}>
              <span className="brand-icon"><AppIcon name="shield" size={26} /></span>
              <div className="brand-text">
                <span className="brand-name">منصة مكافحة الشائعات</span>
                <span className="brand-tag">حروب الجيل الرابع — مصر</span>
              </div>
            </div>
          </div>
          {isAdmin ? (
            <div className="top-bar-end">
              <span className="user-chip">
                <span className="user-chip-icon"><AppIcon name={isAdmin ? 'crown' : 'user'} size={14} /></span>
                {user.name || 'مستخدم'}
              </span>
              <button className="btn-logout" onClick={logout}>خروج</button>
            </div>
          ) : (
            <div className="top-bar-end">
              <button className="btn-admin-login" onClick={() => navigate('/login')}>دخول المشرف</button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="body-wrap">
        {!hideNav && (
          <Sidebar isAdmin={isAdmin} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="content-area">
          <Routes>
            <Route path="/"               element={<Navigate to="/home" replace />} />
            <Route path="/home"           element={<HomePage />} />
            <Route path="/awareness/:slug" element={<AwarenessSectionPage />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/report"         element={<ReportPage />} />
            <Route path="/ai-detect"      element={<AdvancedAIDetection />} />
            <Route path="/ai-chat"        element={<AIChat />} />
            <Route path="/articles"       element={<ArticlesPage />} />
            <Route path="/videos"         element={<VideoAwareness />} />
            <Route path="/ministries"     element={<MinistriesPage />} />
            <Route path="/admin"          element={isAdmin ? <AdminDashboard />      : <Navigate to="/" replace />} />
            <Route path="/admin-articles" element={isAdmin ? <AdminArticles />       : <Navigate to="/" replace />} />
            <Route path="/admin-reports"  element={isAdmin ? <AdminReports />        : <Navigate to="/" replace />} />
            <Route path="/admin-users"    element={isAdmin ? <AdminUsers />          : <Navigate to="/" replace />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <footer className="site-footer">
        <p>© 2025 منصة مكافحة الشائعات | حروب الجيل الرابع — جمهورية مصر العربية</p>
      </footer>
    </div>
  );
}

export default function App() {
  return <Router><AppLayout /></Router>;
}
