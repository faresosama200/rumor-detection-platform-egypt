import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import AppIcon from './AppIcon';

const EDUCATIONAL = [
  { label: 'الوالدين', value: 'parents' },
  { label: 'الأطفال',  value: 'children' },
  { label: 'الديني',   value: 'religious' },
  { label: 'سياسي',    value: 'political' },
  { label: 'فني',      value: 'art' },
  { label: 'ثقافي',    value: 'culture' },
  { label: 'تجاري',    value: 'commercial' },
  { label: 'زراعي',    value: 'agriculture' },
];

const RUMOR = [
  { label: 'أحدث الشائعات', value: 'rumors' },
  { label: 'تحقق AI', value: 'awareness' },
];

export default function Sidebar({ isAdmin, isOpen, onClose }) {
  const [eduOpen, setEduOpen] = useState(true);
  const [rumorOpen, setRumorOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const isArticles = location.pathname === '/articles';

  const go = path => { navigate(path); onClose(); };

  return (
    <>
      {isOpen && <div className="sb-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sb-nav">
          <SbLink to="/home" icon="home" label="الرئيسية" onClick={onClose} />

          {/* Educational Sections */}
          <div className="sb-item-wrap">
            <button
              className={`sb-link sb-toggle ${isArticles ? 'active' : ''}`}
              onClick={() => setEduOpen(o => !o)}
            >
              <AppIcon name="education" size={16} />
              <span className="sb-label">قسم التوعية</span>
              <span className="sb-arrow"><AppIcon name={eduOpen ? 'chevronUp' : 'chevronDown'} size={14} /></span>
            </button>
            <div className={`sb-sub ${eduOpen ? 'open' : ''}`}>
              <button className="sb-sub-link" onClick={() => go('/articles')}><AppIcon name="articles" size={14} /> جميع المقالات</button>
              {EDUCATIONAL.map(c => (
                <button key={c.value} className="sb-sub-link" onClick={() => go('/articles?category=' + c.value)}>
                  <AppIcon name="articles" size={14} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rumors Sections */}
          <div className="sb-item-wrap">
            <button
              className={`sb-link sb-toggle ${isArticles ? 'active' : ''}`}
              onClick={() => setRumorOpen(o => !o)}
            >
              <AppIcon name="rumor" size={16} />
              <span className="sb-label">قسم الشائعات</span>
              <span className="sb-arrow"><AppIcon name={rumorOpen ? 'chevronUp' : 'chevronDown'} size={14} /></span>
            </button>
            <div className={`sb-sub ${rumorOpen ? 'open' : ''}`}>
              {RUMOR.map(c => (
                <button key={c.value} className="sb-sub-link" onClick={() => go('/articles?category=' + c.value)}>
                  <AppIcon name="rumor" size={14} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <SbLink to="/ai-detect"   icon="verify" label="التحقق بالذكاء الاصطناعي" onClick={onClose} />
          <SbLink to="/ai-chat"     icon="chat" label="المساعد الذكي" onClick={onClose} />
          <SbLink to="/report"      icon="report" label="الإبلاغ عن شائعة" onClick={onClose} />
          <SbLink to="/videos"      icon="video" label="الفيديوهات" onClick={onClose} />
          <SbLink to="/ministries"  icon="ministry" label="الجهات الرسمية" onClick={onClose} />

          {isAdmin && (
            <>
              <div className="sb-divider" />
              <p className="sb-section">إدارة المنصة</p>
              <SbLink to="/admin"          icon="admin" label="لوحة التحكم" onClick={onClose} />
              <SbLink to="/admin-reports"  icon="report" label="إدارة البلاغات" onClick={onClose} />
              <SbLink to="/admin-users"    icon="users" label="إدارة المستخدمين" onClick={onClose} />
              <SbLink to="/admin-articles" icon="articles" label="إدارة المقالات" onClick={onClose} />
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

function SbLink({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}>
      <AppIcon name={icon} size={16} />
      <span className="sb-label">{label}</span>
    </NavLink>
  );
}
