import { useEffect, useState } from 'react';
import api from './api';
import { useAuth } from './auth';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, pendingReports: 0, trueReports: 0, falseReports: 0, totalArticles: 0, totalSources: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard').catch(() => ({ data: {} })),
      api.get('/api/reports').catch(() => ({ data: { reports: [] } })),
    ]).then(([d, r]) => {
      setStats(d.data || {});
      setReports((r.data?.reports || r.data || []).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status" /></div>;

  const S = ({ label, value, icon }) => (
    <div className="col-6 col-md-3">
      <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-value">{value?.toLocaleString() || 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>⚙️ لوحة التحكم</h2>
        <p>مرحباً {user?.name || 'المدير'} — نظرة عامة على المنصة</p>
      </div>

      <div className="row g-3 mb-4">
        <S label="إجمالي البلاغات"  value={stats.totalReports}   icon="📊" />
        <S label="قيد المراجعة"     value={stats.pendingReports}  icon="⏳" />
        <S label="المقالات المنشورة" value={stats.totalArticles}  icon="📰" />
        <S label="المصادر الموثوقة"  value={stats.totalSources}   icon="✅" />
      </div>

      <div className="card-form">
        <h5 className="mb-3">📋 أحدث البلاغات</h5>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr><th>العنوان</th><th>التصنيف</th><th>الحالة</th><th>التاريخ</th></tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id}>
                  <td>{r.title || r.claim_text || 'بلاغ'}</td>
                  <td><span className="badge bg-secondary">{r.category || 'عام'}</span></td>
                  <td>
                    <span className={`badge ${r.status === 'pending' ? 'bg-warning text-dark' : r.status === 'true' ? 'bg-success' : 'bg-danger'}`}>
                      {r.status === 'pending' ? 'قيد المراجعة' : r.status === 'true' ? 'صحيح' : 'مضلل'}
                    </span>
                  </td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '-'}</td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={4} className="text-center py-3 text-muted">لا توجد بلاغات حالياً</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
