import { useState, useEffect } from 'react';
import AppIcon from './AppIcon';
import api from './api';

const STATUS_INFO = {
  pending:       { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
  investigating: { label: 'جاري التحقق', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  fact:          { label: 'حقيقة', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
  true:          { label: 'تم التحقق — صحيح', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
  partial:       { label: 'صحيح جزئياً', color: '#a855f7', bg: 'rgba(168,85,247,.1)' },
  rumor:         { label: 'إشاعة', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
  misleading:    { label: 'مضلل', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
  false:         { label: 'مضلل / شائعة', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
};

export default function ReportPage() {
  const hasToken = !!localStorage.getItem('token');
  const [tab,     setTab]     = useState('new');
  const [form,    setForm]    = useState({ title: '', description: '', source_url: '', category: 'general', tags: '' });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');
  const [myReps,  setMyReps]  = useState([]);
  const [rLoading,setRLoading]= useState(false);
  const [open,    setOpen]    = useState(null);

  useEffect(() => {
    if (!(tab === 'mine' && hasToken)) return;
    loadMyReports();
    const id = setInterval(() => loadMyReports(), 10000);
    return () => clearInterval(id);
  }, [tab, hasToken]);

  const loadMyReports = async () => {
    setRLoading(true);
    try {
      const r = await api.get('/api/reports');
      setMyReps(r.data?.reports || r.data || []);
    } catch { setMyReps([]); }
    setRLoading(false);
  };

  const submit = async e => {
    e.preventDefault();
    setMsg(''); setErr(''); setLoading(true);
    try {
      await api.post('/api/reports', form);
      setMsg('تم إرسال البلاغ بنجاح. ستتلقى رداً من الإدارة قريباً.');
      setForm({ title: '', description: '', source_url: '', category: 'general', tags: '' });
      setTab('mine');
      loadMyReports();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'حدث خطأ أثناء الإرسال');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-hero">
        <div className="page-hero-icon"><AppIcon name="report" size={48} /></div>
        <h1>الإبلاغ عن شائعة</h1>
        <p>ساهم في مكافحة المعلومات المضللة — كل بلاغ يُراجعه الفريق المتخصص</p>
      </div>

      {/* Tabs */}
      <div className="rep-tabs">
        <button className={`rep-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
          <AppIcon name="articles" size={14} /> إبلاغ جديد
        </button>
        {hasToken && (
          <button className={`rep-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
            <AppIcon name="report" size={14} /> بلاغاتي
          </button>
        )}
      </div>

      {!hasToken && (
        <div className="inline-msg success" style={{ marginTop: 0 }}>
          يمكنك إرسال البلاغات بدون تسجيل دخول. لمتابعة حالة بلاغاتك لاحقاً يفضل تسجيل الدخول.
        </div>
      )}

      {/* New Report Form */}
      {tab === 'new' && (
        <div className="card-form">
          {msg && <div className="inline-msg success">{msg}</div>}
          {err && <div className="inline-msg error">{err}</div>}
          <form onSubmit={submit}>
            <div className="field-group">
              <label>عنوان الشائعة *</label>
              <input className="field" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required placeholder="اكتب عنوان الشائعة بإيجاز..." />
            </div>
            <div className="field-group">
              <label>تفاصيل الشائعة *</label>
              <textarea className="field" rows={5} value={form.description} onChange={e => setForm({...form,description:e.target.value})} required placeholder="اشرح الشائعة بالتفصيل: أين انتشرت؟ ما محتواها؟..." />
            </div>
            <div className="field-group">
              <label>رابط المصدر (اختياري)</label>
              <input className="field" type="url" value={form.source_url} onChange={e => setForm({...form,source_url:e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-grid">
              <div className="field-group">
                <label>التصنيف</label>
                <select className="field" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                  <option value="general">عام</option>
                  <option value="health">صحة</option>
                  <option value="politics">سياسة</option>
                  <option value="economy">اقتصاد</option>
                  <option value="security">أمن</option>
                  <option value="religion">دين</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="field-group">
                <label>الوسوم (اختياري)</label>
                <input className="field" value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="شائعة، صحة، ..." />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{marginTop:8}}>
              {loading ? <span className="spinner" /> : <><AppIcon name="spark" size={16} /> إرسال البلاغ</>}
            </button>
          </form>
        </div>
      )}

      {/* My Reports */}
      {tab === 'mine' && hasToken && (
        <div className="card-form">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{color:'var(--c-gold)',margin:0}}><AppIcon name="report" size={18} /> بلاغاتي المُرسلة</h3>
            <button className="btn-cancel" onClick={loadMyReports}><AppIcon name="verify" size={14} /> تحديث</button>
          </div>
          {rLoading ? (
            <div className="center-loader"><span className="spin" /> جاري التحميل...</div>
          ) : myReps.length === 0 ? (
            <div className="empty-box">
              <AppIcon name="report" size={40} />
              <p>لم ترسل أي بلاغات بعد</p>
              <button className="btn-add" onClick={() => setTab('new')}>+ إرسال بلاغ أول</button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {myReps.map(r => {
                const st = STATUS_INFO[r.status] || STATUS_INFO.pending;
                const isOpen = open === r.report_id;
                return (
                  <div key={r.report_id} className="my-rep-card" style={{'--accent': st.color}}>
                    <div className="my-rep-header" onClick={() => setOpen(isOpen ? null : r.report_id)}>
                      <div className="my-rep-info">
                        <span className="my-rep-title">{r.title}</span>
                        <div className="my-rep-meta">
                          <span><AppIcon name="verify" size={12} /> {r.category || 'عام'}</span>
                          <span><AppIcon name="globe" size={12} /> {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}</span>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span className="my-rep-status" style={{color:st.color, background:st.bg}}>{st.label}</span>
                        <AppIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={12} />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="my-rep-body">
                        <div className="my-rep-desc">
                          <strong><AppIcon name="articles" size={12} /> تفاصيل البلاغ:</strong>
                          <p>{r.description}</p>
                        </div>
                        {r.source_url && (
                          <div style={{marginTop:8}}>
                            <strong><AppIcon name="globe" size={12} /> المصدر: </strong>
                            <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{color:'var(--c-blue)'}}>
                              {r.source_url}
                            </a>
                          </div>
                        )}
                        {r.admin_notes ? (
                          <div className="my-rep-admin-reply">
                            <div className="my-rep-reply-title"><AppIcon name="trusted" size={12} /> رد الإدارة:</div>
                            <p>{r.admin_notes}</p>
                          </div>
                        ) : (
                          <div className="my-rep-pending-note">
                            <AppIcon name="brain" size={12} /> لم يصدر رد من الإدارة بعد. سيتم مراجعة بلاغك قريباً.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
