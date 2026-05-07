import React, { useState, useEffect, useCallback } from 'react';
import AppIcon from './AppIcon';
import api from './api';

const STATUS = {
  pending:       { label: 'قيد المراجعة',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  investigating: { label: 'جاري التحقق',  color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  rumor:         { label: 'إشاعة',         color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
  fact:          { label: 'حقيقة',         color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  partial:       { label: 'صحيح جزئياً',  color: '#a855f7', bg: 'rgba(168,85,247,.12)' },
  misleading:    { label: 'مضلل',          color: '#f97316', bg: 'rgba(249,115,22,.12)' },
  true:          { label: 'صحيح',          color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  false:         { label: 'مضلل',          color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
};

const CAT_LABELS = {
  general:  'عام', health: 'صحة', politics: 'سياسة',
  economy:  'اقتصاد', security: 'أمن', religion: 'دين', other: 'أخرى',
};

export default function AdminReports() {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [reply,    setReply]    = useState({ status: 'pending', admin_notes: '' });
  const [msg,      setMsg]      = useState(null);
  const [search,   setSearch]   = useState('');

  const normalizeReports = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.reports)) return payload.reports;
    if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = '/api/reports' + (filter !== 'all' ? `?status=${filter}` : '');
      const r = await api.get(url);
      setReports(normalizeReports(r.data));
      setMsg(null);
    } catch (ex) {
      setReports([]);
      setMsg({ type: 'error', text: ex.response?.data?.message || 'تعذر تحميل البلاغات حالياً' });
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openReport = (r) => {
    setSelected(r);
    setReply({ status: r.status || 'pending', admin_notes: r.admin_notes || '' });
    setMsg(null);
  };

  const submitReply = async () => {
    if (!selected) return;
    setSaving(true); setMsg(null);
    try {
      await api.put(`/api/reports/${selected.report_id}`, reply);
      setMsg({ type: 'success', text: 'تم تحديث البلاغ بنجاح' });
      setReports(prev => prev.map(r => r.report_id === selected.report_id ? { ...r, ...reply } : r));
      setSelected(s => ({ ...s, ...reply }));
      await load();
    } catch (ex) {
      setMsg({ type: 'error', text: ex.response?.data?.message || 'حدث خطأ' });
    }
    setSaving(false);
  };

  const deleteReport = async (id) => {
    if (!window.confirm('هل تريد حذف هذا البلاغ نهائياً؟')) return;
    try {
      await api.delete(`/api/reports/${id}`);
      setReports(prev => prev.filter(r => r.report_id !== id));
      if (selected?.report_id === id) setSelected(null);
    } catch {}
  };

  const filtered = reports.filter(r =>
    !search ||
    r.title?.includes(search) ||
    r.description?.includes(search) ||
    r.user_name?.includes(search)
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-hero">
        <div className="page-hero-icon"><AppIcon name="report" size={48} /></div>
        <h1>إدارة البلاغات</h1>
        <p>مراجعة بلاغات المستخدمين والرد عليها رسمياً</p>
      </div>

      {/* Stats */}
      <div className="rep-stats">
        {['all','pending','investigating','rumor','fact','partial','misleading'].map(s => {
          const count = s === 'all' ? reports.length : reports.filter(r => r.status === s).length;
          const info = s === 'all' ? { label: 'الكل', color: '#94a3b8' } : STATUS[s] || { label: s, color: '#94a3b8' };
          return (
            <button key={s}
              className={`rep-stat-btn ${filter === s ? 'active' : ''}`}
              style={{ '--accent': info.color }}
              onClick={() => setFilter(s)}
            >
              <span className="rep-stat-num" style={{ color: info.color }}>{count}</span>
              <span className="rep-stat-lbl">{info.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rep-layout">
        {/* Left: List */}
        <div className="rep-list-wrap">
          <div className="rep-search-wrap">
            <AppIcon name="search" size={14} />
            <input
              className="rep-search"
              placeholder="ابحث في البلاغات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="center-loader"><span className="spin" /> جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-box">
              <AppIcon name="report" size={40} />
              <p>لا توجد بلاغات</p>
            </div>
          ) : (
            <div className="rep-list">
              {filtered.map(r => {
                const st = STATUS[r.status] || STATUS.pending;
                const isActive = selected?.report_id === r.report_id;
                return (
                  <div
                    key={r.report_id}
                    className={`rep-row ${isActive ? 'active' : ''}`}
                    onClick={() => openReport(r)}
                  >
                    <div className="rep-row-top">
                      <span className="rep-row-title">{r.title}</span>
                      <span className="rep-status-dot" style={{ background: st.color }} title={st.label} />
                    </div>
                    <div className="rep-row-meta">
                      <span><AppIcon name="user" size={12} /> {r.user_name || 'مجهول'}</span>
                      <span><AppIcon name="verify" size={12} /> {CAT_LABELS[r.category] || r.category || 'عام'}</span>
                      <span><AppIcon name="globe" size={12} /> {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}</span>
                    </div>
                    <div className="rep-status-badge" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail + Reply */}
        <div className="rep-detail-wrap">
          {!selected ? (
            <div className="rep-empty-detail">
              <AppIcon name="report" size={40} />
              <p>اختر بلاغاً من القائمة للاطلاع على تفاصيله</p>
            </div>
          ) : (
            <div className="rep-detail">
              {/* Report Info */}
              <div className="rep-detail-header">
                <div className="rep-detail-title-wrap">
                  <h2 className="rep-detail-title">{selected.title}</h2>
                  <button className="btn-del" onClick={() => deleteReport(selected.report_id)}>
                    <AppIcon name="close" size={14} /> حذف
                  </button>
                </div>
                <div className="rep-detail-meta-row">
                  <span className="rep-meta-chip"><AppIcon name="user" size={12} /> {selected.user_name || 'مجهول'}</span>
                  <span className="rep-meta-chip"><AppIcon name="verify" size={12} /> {selected.user_email || '—'}</span>
                  <span className="rep-meta-chip"><AppIcon name="verify" size={12} /> {CAT_LABELS[selected.category] || selected.category || 'عام'}</span>
                  <span className="rep-meta-chip"><AppIcon name="globe" size={12} /> {selected.created_at ? new Date(selected.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="rep-section">
                <h4 className="rep-section-title"><AppIcon name="articles" size={14} /> تفاصيل البلاغ</h4>
                <p className="rep-desc">{selected.description}</p>
              </div>

              {/* Source URL */}
              {selected.source_url && (
                <div className="rep-section">
                  <h4 className="rep-section-title"><AppIcon name="globe" size={14} /> رابط المصدر</h4>
                  <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="rep-link">
                    {selected.source_url}
                  </a>
                </div>
              )}

              {/* Tags */}
              {selected.tags && (
                <div className="rep-section">
                  <h4 className="rep-section-title"><AppIcon name="verify" size={14} /> الوسوم</h4>
                  <div className="rep-tags">
                    {selected.tags.split(',').map((t,i) => (
                      <span key={i} className="rep-tag">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous admin notes */}
              {selected.admin_notes && (
                <div className="rep-section rep-section--reply">
                  <h4 className="rep-section-title"><AppIcon name="verify" size={14} /> رد الإدارة السابق</h4>
                  <p className="rep-desc">{selected.admin_notes}</p>
                </div>
              )}

              {/* Reply Form */}
              <div className="rep-reply-form">
                <h4 className="rep-section-title"><AppIcon name="spark" size={14} /> الرد الرسمي</h4>
                <div className="field-group" style={{marginBottom:10}}>
                  <label>الحالة</label>
                  <select className="field" value={reply.status} onChange={e => setReply(r => ({...r, status: e.target.value}))}>
                    <option value="pending">قيد المراجعة</option>
                    <option value="investigating">جاري التحقق</option>
                    <option value="rumor">إشاعة</option>
                    <option value="fact">حقيقة</option>
                    <option value="partial">صحيح جزئياً</option>
                    <option value="misleading">مضلل</option>
                  </select>
                </div>
                <div className="field-group" style={{marginBottom:10}}>
                  <label>ملاحظات الإدارة</label>
                  <textarea className="field" rows={3} value={reply.admin_notes}
                    onChange={e => setReply(r => ({...r, admin_notes: e.target.value}))}
                    placeholder="اكتب رداً رسمياً أو تعليقاً..." />
                </div>
                {msg && (
                  <div className={`inline-msg ${msg.type === 'success' ? 'success' : 'error'}`} style={{marginBottom:8}}>
                    {msg.text}
                  </div>
                )}
                <button className="btn-primary" onClick={submitReply} disabled={saving}>
                  {saving ? <><span className="spin" /> جاري الحفظ...</> : <><AppIcon name="trusted" size={14} /> حفظ الرد</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
