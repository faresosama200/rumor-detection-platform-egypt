import { useEffect, useState } from 'react';
import api from './api';
import AppIcon from './AppIcon';

const ROLES = [
  { value: 'user',     label: 'مستخدم عادي',  badge: 'bg-secondary' },
  { value: 'admin',    label: 'مدير',           badge: 'bg-danger' },
  { value: 'reviewer', label: 'مراجع',          badge: 'bg-warning text-dark' },
];

function roleBadge(role) {
  const r = ROLES.find(x => x.value === role) || ROLES[0];
  return <span className={`badge ${r.badge}`}>{r.label}</span>;
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [saving,  setSaving]  = useState(null);
  const [msg,     setMsg]     = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/admin/users')
      .then(r => setUsers(r.data?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId, newRole) => {
    setSaving(userId);
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      setMsg('تم تحديث الدور بنجاح');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('فشل تحديث الدور');
      setTimeout(() => setMsg(''), 3000);
    } finally { setSaving(null); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.includes(search) || u.email?.includes(search);
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  const totalAdmins    = users.filter(u => u.role === 'admin').length;
  const totalReviewers = users.filter(u => u.role === 'reviewer').length;
  const totalRegular   = users.filter(u => u.role === 'user').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><AppIcon name="users" size={18} /> إدارة المستخدمين</h2>
        <p>عرض وإدارة جميع مستخدمي المنصة</p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon"><AppIcon name="users" size={22} /></div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">إجمالي المستخدمين</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon"><AppIcon name="crown" size={22} /></div>
            <div className="stat-value">{totalAdmins}</div>
            <div className="stat-label">المديرون</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon"><AppIcon name="verify" size={22} /></div>
            <div className="stat-value">{totalReviewers}</div>
            <div className="stat-label">المراجعون</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon"><AppIcon name="user" size={22} /></div>
            <div className="stat-value">{totalRegular}</div>
            <div className="stat-label">مستخدمون عاديون</div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('فشل') ? 'alert-danger' : 'alert-success'} mb-3`}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="card-form mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 بحث بالاسم أو الإيميل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">جميع الأدوار</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={fetchUsers}><AppIcon name="search" size={14} /> تحديث</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-form">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-warning" role="status" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور الحالي</th>
                  <th>تاريخ التسجيل</th>
                  <th>تغيير الدور</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.user_id}>
                    <td className="text-muted">{i + 1}</td>
                    <td><strong>{u.name || '—'}</strong></td>
                    <td className="text-muted small">{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td className="text-muted small">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={u.role}
                        disabled={saving === u.user_id}
                        onChange={e => changeRole(u.user_id, e.target.value)}
                        style={{ minWidth: 120 }}
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      لا يوجد مستخدمون مطابقون للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
