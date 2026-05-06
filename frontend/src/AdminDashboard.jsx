import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useAuth } from './auth';
import AppIcon from './AppIcon';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState({ totalReports: 0, pendingReports: 0, trueReports: 0, falseReports: 0, totalArticles: 0, totalSources: 0 });
  const [users,   setUsers]   = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = (opts = {}) => {
    const silent = !!opts.silent;
    if (!silent) setLoading(true);
    Promise.all([
      api.get('/api/dashboard').catch(() => ({ data: {} })),
      api.get('/api/reports').catch(() => ({ data: { reports: [] } })),
      api.get('/api/admin/users').catch(() => ({ data: { users: [] } })),
    ]).then(([d, r, u]) => {
      setStats(d.data || {});
      setReports((r.data?.reports || r.data || []).slice(0, 5));
      setUsers(u.data?.users || []);
    }).finally(() => {
      if (!silent) setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
    const id = setInterval(() => refresh({ silent: true }), 10000);
    return () => clearInterval(id);
  }, []);

  const statusInfo = (status) => {
    if (['pending', 'investigating'].includes(status)) {
      return { label: status === 'investigating' ? 'جاري التحقق' : 'قيد المراجعة', color: '#d97706', background: '#fef3c7' };
    }
    if (['true', 'fact', 'partial'].includes(status)) {
      return { label: status === 'partial' ? 'صحيح جزئياً' : 'حقيقة', color: '#16a34a', background: '#dcfce7' };
    }
    if (['false', 'rumor', 'misleading'].includes(status)) {
      return { label: status === 'rumor' ? 'إشاعة' : 'مضلل', color: '#dc2626', background: '#fee2e2' };
    }
    return { label: status || 'غير محدد', color: '#64748b', background: '#e2e8f0' };
  };

  if (loading) return (
    <div className="page-wrap">
      <div className="center-loader" style={{minHeight:300}}>
        <span className="spin" /> جاري تحميل البيانات...
      </div>
    </div>
  );

  const trueRate  = stats.totalReports > 0 ? Math.round((stats.trueReports  || 0) / stats.totalReports * 100) : 0;
  const falseRate = stats.totalReports > 0 ? Math.round((stats.falseReports || 0) / stats.totalReports * 100) : 0;
  const adminCount    = users.filter(u => u.role === 'admin').length;
  const reviewerCount = users.filter(u => u.role === 'reviewer').length;
  const userCount     = users.filter(u => u.role === 'user' || !u.role).length;

  const StatCard = ({ label, value, icon, to, color = 'var(--c-blue)' }) => (
    <div
      className="dash-stat-card"
      style={{ borderBottom: `3px solid ${color}`, cursor: to ? 'pointer' : 'default' }}
      onClick={to ? () => navigate(to) : undefined}
    >
      <div className="dash-stat-icon" style={{ background: color + '1a' }}>
        <AppIcon name={icon} size={22} />
      </div>
      <div className="dash-stat-body">
        <div className="dash-stat-value" style={{ color }}>{String(value ?? 0)}</div>
        <div className="dash-stat-label">{label}</div>
      </div>
      {to && <AppIcon name="chevronDown" size={12} style={{ transform: 'rotate(-90deg)', color: '#aaa' }} />}
    </div>
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-hero">
        <div className="page-hero-icon"><AppIcon name="admin" size={48} /></div>
        <h1>لوحة التحكم</h1>
        <p>مرحباً {user?.name || 'المدير'} — نظرة عامة على المنصة</p>
      </div>

      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-cancel" onClick={refresh}>
          <AppIcon name="search" size={14} /> تحديث البيانات
        </button>
      </div>

      {/* Primary Stats */}
      <div className="dash-stats-grid">
        <StatCard label="إجمالي البلاغات"    value={stats.totalReports}   icon="report"    to="/admin-reports"   color="#3b82f6" />
        <StatCard label="قيد المراجعة"       value={stats.pendingReports} icon="verify"    to="/admin-reports"   color="#f59e0b" />
        <StatCard label="المقالات المنشورة"  value={stats.totalArticles}  icon="articles"  to="/admin-articles"  color="#10b981" />
        <StatCard label="إجمالي المستخدمين"  value={users.length}         icon="users"     to="/admin-users"     color="#8b5cf6" />
      </div>

      {/* Secondary Stats */}
      <div className="dash-stats-grid" style={{ marginTop: 12 }}>
        <StatCard label="بلاغات صحيحة"  value={stats.trueReports  || 0} icon="trusted" color="#10b981" />
        <StatCard label="بلاغات مضللة"  value={stats.falseReports || 0} icon="rumor"   color="#ef4444" />
        <StatCard label="معدل الصحة"    value={`${trueRate}%`}          icon="spark"   color="#0a5ca8" />
        <StatCard label="معدل التضليل"  value={`${falseRate}%`}         icon="brain"   color="#f97316" />
      </div>

      {/* Info Cards */}
      <div className="dash-cards-row">
        {/* Users breakdown */}
        <div className="card-form">
          <h6 className="dash-section-title"><AppIcon name="users" size={16} /> توزيع المستخدمين</h6>
          <div className="dash-breakdown">
            <div className="dash-breakdown-row">
              <span><AppIcon name="crown" size={14} /> مديرون</span>
              <span className="dash-badge" style={{background:'#fee2e2',color:'#dc2626'}}>{adminCount}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="verify" size={14} /> مراجعون</span>
              <span className="dash-badge" style={{background:'#fef3c7',color:'#d97706'}}>{reviewerCount}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="user" size={14} /> مستخدمون</span>
              <span className="dash-badge" style={{background:'#e0f2fe',color:'#0284c7'}}>{userCount}</span>
            </div>
          </div>
          <button className="btn-cancel" style={{width:'100%',marginTop:12}} onClick={() => navigate('/admin-users')}>
            <AppIcon name="users" size={14} /> إدارة المستخدمين
          </button>
        </div>

        {/* Reports breakdown */}
        <div className="card-form">
          <h6 className="dash-section-title"><AppIcon name="report" size={16} /> حالة البلاغات</h6>
          <div className="dash-breakdown">
            <div className="dash-breakdown-row">
              <span><AppIcon name="brain" size={14} /> قيد المراجعة</span>
              <span className="dash-badge" style={{background:'#fef3c7',color:'#d97706'}}>{stats.pendingReports || 0}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="trusted" size={14} /> صحيحة</span>
              <span className="dash-badge" style={{background:'#dcfce7',color:'#16a34a'}}>{stats.trueReports || 0}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="rumor" size={14} /> مضللة</span>
              <span className="dash-badge" style={{background:'#fee2e2',color:'#dc2626'}}>{stats.falseReports || 0}</span>
            </div>
          </div>
          <button className="btn-cancel" style={{width:'100%',marginTop:12}} onClick={() => navigate('/admin-reports')}>
            <AppIcon name="report" size={14} /> إدارة البلاغات
          </button>
        </div>

        {/* Content breakdown */}
        <div className="card-form">
          <h6 className="dash-section-title"><AppIcon name="articles" size={16} /> المحتوى</h6>
          <div className="dash-breakdown">
            <div className="dash-breakdown-row">
              <span><AppIcon name="articles" size={14} /> مقالات منشورة</span>
              <span className="dash-badge" style={{background:'#e0f2fe',color:'#0284c7'}}>{stats.totalArticles || 0}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="trusted" size={14} /> مصادر موثوقة</span>
              <span className="dash-badge" style={{background:'#dcfce7',color:'#16a34a'}}>{stats.totalSources || 0}</span>
            </div>
            <div className="dash-breakdown-row">
              <span><AppIcon name="report" size={14} /> إجمالي البلاغات</span>
              <span className="dash-badge" style={{background:'#ede9fe',color:'#7c3aed'}}>{stats.totalReports || 0}</span>
            </div>
          </div>
          <button className="btn-cancel" style={{width:'100%',marginTop:12}} onClick={() => navigate('/admin-articles')}>
            <AppIcon name="articles" size={14} /> إدارة المقالات
          </button>
        </div>
      </div>

      {/* Latest Reports Table */}
      <div className="card-form" style={{marginTop:20}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h6 className="dash-section-title" style={{margin:0}}><AppIcon name="report" size={16} /> أحدث البلاغات</h6>
          <button className="btn-cancel" onClick={() => navigate('/admin-reports')}>عرض الكل</button>
        </div>
        {reports.length === 0 ? (
          <div className="empty-box"><AppIcon name="report" size={32} /><p>لا توجد بلاغات حالياً</p></div>
        ) : (
          <div className="dash-reports-list">
            {reports.map(r => (
              <div key={r.report_id} className="dash-report-row">
                {(() => {
                  const st = statusInfo(r.status);
                  return (
                    <>
                <div className="dash-report-title">{r.title || r.claim_text || 'بلاغ'}</div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                  <span className="rep-tag">{r.category || 'عام'}</span>
                  <span className="rep-status-badge" style={{
                    color: st.color,
                    background: st.background,
                  }}>
                    {st.label}
                  </span>
                  <span style={{fontSize:11,color:'var(--c-muted)',whiteSpace:'nowrap'}}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}
                  </span>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
