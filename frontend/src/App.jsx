import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import AIChat from './AIChat';
import AdvancedAIDetection from './AdvancedAIDetection';
import ArticlesData from './ArticlesData';
import VideoAwareness from './VideoAwareness';
import AdminArticles from './AdminArticles';
import './styles.css';

function App() {
    const [menuOpen, setMenuOpen] = useState(false);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isAuthenticated = !!token;
    const isAdmin = role === 'admin';

    const closeMenu = () => setMenuOpen(false);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <Router>
            <div className="app-wrapper">
                <header className="app-header">
                    <div className="header-container">
                        <div className="logo-section">
                            <span className="logo-icon">🛡️</span>
                            <div className="logo-text">
                                <h1>منصة مكافحة الشائعات</h1>
                                <p>حروب الجيل الرابع - مصر</p>
                            </div>
                        </div>

                        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="القائمة">
                            <span>{menuOpen ? '✕' : '☰'}</span>
                        </button>

                        <nav className={`main-nav${menuOpen ? ' nav-open' : ''}`}>
                            {isAuthenticated ? (
                                <>
                                    <NavLink to="/report" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>📢 إبلاغ</NavLink>
                                    <NavLink to="/articles" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>📰 مقالات</NavLink>
                                    <NavLink to="/ai-detect" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>🔍 تحقق AI</NavLink>
                                    <NavLink to="/ai-chat" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>🤖 دردشة AI</NavLink>
                                    <NavLink to="/videos" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>🎬 فيديوهات</NavLink>
                                    {isAdmin && <NavLink to="/admin" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>⚙️ لوحة التحكم</NavLink>}
                                    {isAdmin && <NavLink to="/admin-articles" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>📝 المقالات</NavLink>}
                                    <button className="nav-link logout-btn" onClick={() => { handleLogout(); closeMenu(); }}>🚪 خروج</button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/login" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>🔐 دخول</NavLink>
                                    <NavLink to="/register" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>📝 تسجيل</NavLink>
                                </>
                            )}
                        </nav>
                    </div>
                    {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
                </header>

                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<Navigate to={isAuthenticated ? '/report' : '/login'} replace />} />
                        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/report" replace />} />
                        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/report" replace />} />
                        <Route path="/report" element={isAuthenticated ? <AdvancedAIDetection /> : <Navigate to="/login" replace />} />
                        <Route path="/ai-detect" element={isAuthenticated ? <AdvancedAIDetection /> : <Navigate to="/login" replace />} />
                        <Route path="/ai-chat" element={isAuthenticated ? <AIChat /> : <Navigate to="/login" replace />} />
                        <Route path="/articles" element={isAuthenticated ? <ArticlesData /> : <Navigate to="/login" replace />} />
                        <Route path="/videos" element={isAuthenticated ? <VideoAwareness /> : <Navigate to="/login" replace />} />
                        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />
                        <Route path="/admin-articles" element={isAdmin ? <AdminArticles /> : <Navigate to="/" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <footer className="app-footer">
                    <p>🛡️ منصة مكافحة الشائعات وحروب الجيل الرابع &copy; {new Date().getFullYear()} | مصر</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
