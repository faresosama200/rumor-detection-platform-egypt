import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './api';
import AppIcon from './AppIcon';
import { AWARENESS_SECTIONS } from './awarenessContent';

const OFFICIAL_ENTITIES = [
  { key: 'ministry', name: 'الوزارات',                     icon: 'ministry',  note: 'مصادر الحكومة الرسمية',             route: '/ministries' },
  { key: 'media',    name: 'المجلس الإعلامي',              icon: 'media',     note: 'محتوى إعلامي موثق',                  url: 'https://media.gov.eg' },
  { key: 'supreme',  name: 'المجلس الأعلى لتنظيم الإعلام', icon: 'broadcast', note: 'تنظيم ومتابعة النشر',                url: 'https://www.scm.gov.eg' },
  { key: 'sis',      name: 'الهيئة العامة للاستعلامات',     icon: 'globe',     note: 'بيانات ومعلومات رسمية',              url: 'https://www.sis.gov.eg' },
];

/* ── Donut Chart Component ── */
function DonutChart({ pending = 0, trueVal = 0, falseVal = 0 }) {
  const total = pending + trueVal + falseVal;
  const displayTotal = total === 0 ? 1 : total;

  const segments = [
    { label: 'مفندة',      value: falseVal,  color: '#ef4444' },
    { label: 'قيد التحقق', value: pending,   color: '#f59e0b' },
    { label: 'صحيحة',      value: trueVal,   color: '#10b981' },
  ];

  const cx = 90, cy = 90, r = 70, innerR = 42;
  const gap = 0.02; // radians gap between slices
  let currentAngle = -Math.PI / 2;

  const slices = segments.map(seg => {
    const fraction = total === 0 ? (1 / 3) : (seg.value / displayTotal);
    const angle = fraction * 2 * Math.PI - gap;
    const startAngle = currentAngle + gap / 2;
    currentAngle += fraction * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { ...seg, path, fraction };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', direction: 'rtl' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.92} />
        ))}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#333" fontSize="13" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#888" fontSize="10">بلاغ</text>
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: 'inline-block' }} />
            <span style={{ color: '#444' }}>{s.label}</span>
            <span style={{ color: s.color, fontWeight: 700 }}>({Math.round(s.fraction * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Activity Bar Chart ── */
function BarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100, direction: 'rtl', padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.val}</span>
          <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '4px 4px 0 0', height: 70, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              background: d.color,
              borderRadius: '4px 4px 0 0',
              height: `${Math.round((d.val / max) * 70)}px`,
              minHeight: d.val > 0 ? 4 : 0,
              transition: 'height 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#666', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [artLoading, setArtLoading] = useState(false);
  const [rumors, setRumors] = useState([]);
  const [rumorLoading, setRumorLoading] = useState(false);
  const [rumorDone, setRumorDone] = useState(false);
  const [latestFeed, setLatestFeed] = useState([]);
  const [fieldInterviews, setFieldInterviews] = useState([]);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState({ title: '', imageFile: null });
  const [fieldMsg, setFieldMsg] = useState('');
  const isAdmin = localStorage.getItem('role') === 'admin';

  const openOfficialEntity = (entity) => {
    if (entity.route) {
      navigate(entity.route);
      return;
    }
    if (entity.url) {
      window.open(entity.url, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchStats = () => {
    fetch(`${API_BASE}/api/public-stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  };

  const fetchFeed = () => {
    fetch(`${API_BASE}/api/latest-feed?limit=8`)
      .then(r => r.json())
      .then(d => setLatestFeed(Array.isArray(d?.items) ? d.items : []))
      .catch(() => {});
  };

  const fetchArticles = async () => {
    setArtLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/articles?limit=1`);
      const d = await r.json();
      setArticles(Array.isArray(d) ? d : []);
    } catch {}
    setArtLoading(false);
  };

  const fetchRumors = async () => {
    setRumorLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/trending-rumors`);
      const d = await r.json();
      setRumors(d.items || []);
      setRumorDone(true);
    } catch { setRumors([]); setRumorDone(true); }
    setRumorLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchArticles();
    fetchFeed();
    fetchRumors();
    fetch(`${API_BASE}/api/field-interviews`)
      .then(r => r.json())
      .then(d => setFieldInterviews(Array.isArray(d?.items) ? d.items : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const feedId = setInterval(fetchFeed, 10000);
    const liveId = setInterval(() => {
      fetchStats();
      fetchRumors();
      fetchArticles();
    }, 10000);
    return () => {
      clearInterval(feedId);
      clearInterval(liveId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFieldInterview = async (e) => {
    e.preventDefault();
    setFieldMsg('');
    if (!fieldForm.title.trim()) {
      setFieldMsg('العنوان مطلوب');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', fieldForm.title);
      if (fieldForm.imageFile) formData.append('image', fieldForm.imageFile);
      const r = await fetch(`${API_BASE}/api/field-interviews`, {
        method: 'POST',
        headers: { Authorization: token ? 'Bearer ' + token : '' },
        body: formData,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'فشل إضافة الصورة');
      setFieldForm({ title: '', imageFile: null });
      setShowFieldForm(false);
      setFieldMsg('تمت إضافة الصورة الميدانية');
      const rr = await fetch(`${API_BASE}/api/field-interviews`);
      const dd = await rr.json();
      setFieldInterviews(Array.isArray(dd?.items) ? dd.items : []);
    } catch (err) {
      setFieldMsg(err.message || 'تعذر إضافة الصورة');
    }
  };

  const deleteFieldInterview = async (id) => {
    if (!window.confirm('حذف الصورة الميدانية؟')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/field-interviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? 'Bearer ' + token : '' },
      });
      setFieldInterviews(prev => prev.filter(x => x.interview_id !== id));
    } catch {}
  };

  return (
    <div className="home-page">

      {/* ── Moving Ticker ── */}
      <section className="top-ticker-wrap">
        <div className="top-ticker-label">آخر التحديثات</div>
        <div className="top-ticker-track">
          <div className="top-ticker-marquee">
            {(latestFeed.length ? latestFeed : [{ type: 'notice', title: 'لا توجد تحديثات حالياً' }]).map((item, i) => (
              <span key={`a-${i}`} className={`top-ticker-item ${item.type || 'notice'}`}>
                <span className="top-ticker-kind">
                  {item.type === 'report'
                    ? <><AppIcon name="report" size={12} /> بلاغ</>
                    : item.type === 'article'
                      ? <><AppIcon name="articles" size={12} /> مقال</>
                    : item.type === 'rumor'
                      ? <><AppIcon name="rumor" size={12} /> شائعة</>
                      : item.type === 'world-rumor'
                        ? <><AppIcon name="globe" size={12} /> رصد عالمي</>
                      : <><AppIcon name="media" size={12} /> تحديث</>}
                </span>
                <span>{item.title}</span>
                {item.created_at && (
                  <span className="top-ticker-time">
                    {new Date(item.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </span>
            ))}
            {(latestFeed.length ? latestFeed : [{ type: 'notice', title: 'لا توجد تحديثات حالياً' }]).map((item, i) => (
              <span key={`b-${i}`} className={`top-ticker-item ${item.type || 'notice'}`}>
                <span className="top-ticker-kind">
                  {item.type === 'report'
                    ? <><AppIcon name="report" size={12} /> بلاغ</>
                    : item.type === 'article'
                      ? <><AppIcon name="articles" size={12} /> مقال</>
                    : item.type === 'rumor'
                      ? <><AppIcon name="rumor" size={12} /> شائعة</>
                      : item.type === 'world-rumor'
                        ? <><AppIcon name="globe" size={12} /> رصد عالمي</>
                      : <><AppIcon name="media" size={12} /> تحديث</>}
                </span>
                <span>{item.title}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero ── */}
      <section className="hero-wrap">
        <div className="hero-inner">
          <div className="hero-emblem"><AppIcon name="shield" size={80} /></div>
          <h1 className="hero-title">منصة <span>مكافحة الشائعات</span></h1>
          <p className="hero-sub">حروب الجيل الرابع — جمهورية مصر العربية</p>
          <p className="hero-desc">
            نحارب المعلومات المضللة بالذكاء الاصطناعي والتحقق الفوري من الأخبار والتوعية المجتمعية
          </p>
          <div className="hero-btns">
            <button className="btn-hero-main" onClick={() => navigate('/ai-detect')}><AppIcon name="search" size={16} /> تحقق من خبر الآن</button>
            <button className="btn-hero-sec"  onClick={() => navigate('/report')}><AppIcon name="report" size={16} /> إرسال بلاغ جديد</button>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      {stats && (
        <div className="stats-strip">
          {[
            { val: stats.totalReports   || 0, key: 'بلاغ مرصود'  },
            { val: stats.pendingReports || 0, key: 'قيد التحقق'   },
            { val: stats.totalArticles  || 0, key: 'مقال توعوي'   },
            { val: stats.totalUsers     || 0, key: 'مستخدم نشط'   },
          ].map((s, i) => (
            <div key={i} className="stat-cell">
              <span className="stat-val">{s.val}</span>
              <span className="stat-key">{s.key}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Dashboard Charts ── */}
      {stats && (
        <section style={{ padding: '28px 16px 8px', direction: 'rtl' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2a4a' }}>لوحة البيانات التحليلية</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

            {/* Donut Chart — حالة البلاغات */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2a4a', marginBottom: 14, textAlign: 'right' }}>حالة البلاغات</div>
              <DonutChart
                pending={stats.pendingReports || 0}
                trueVal={stats.trueReports || 0}
                falseVal={stats.falseReports || 0}
              />
            </div>

            {/* Bar Chart — نشاط المنصة */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2a4a', marginBottom: 14 }}>نشاط المنصة</div>
              <BarChart data={[
                { label: 'البلاغات',  val: stats.totalReports   || 0, color: '#2563eb' },
                { label: 'المقالات',  val: stats.totalArticles  || 0, color: '#059669' },
                { label: 'المستخدمين',val: stats.totalUsers     || 0, color: '#7c3aed' },
                { label: 'قيد التحقق',val: stats.pendingReports || 0, color: '#f59e0b' },
              ]} />
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'إجمالي البلاغات', val: stats.totalReports   || 0, icon: '📈', color: '#2563eb', bg: '#eff6ff' },
                { label: 'قيد التحقق',      val: stats.pendingReports || 0, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
                { label: 'مقالات توعوية',   val: stats.totalArticles  || 0, icon: '📰', color: '#059669', bg: '#ecfdf5' },
                { label: 'مستخدمون نشطون', val: stats.totalUsers     || 0, icon: '👥', color: '#7c3aed', bg: '#f5f3ff' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${s.color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ── Official Entities ── */}
      <section className="official-home-boxes">
        {OFFICIAL_ENTITIES.map(x => (
          <button key={x.key} className="official-home-card" onClick={() => openOfficialEntity(x)}>
            <span className="official-home-icon"><AppIcon name={x.icon} size={22} /></span>
            <span className="official-home-name">{x.name}</span>
            <span className="official-home-note">{x.note}</span>
          </button>
        ))}
      </section>

      {/* ── 4 Panels ── */}
      <div className="panels">

        {/* Panel 1 — Latest Articles */}
        <div className="panel-card">
          <div className="panel-head panel-head-blue" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="panel-head-icon">📰</span>
              <h2 style={{ margin: 0 }}>أحدث المقالات التوعوية</h2>
            </div>
            <button onClick={fetchArticles} disabled={artLoading}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.5)', color: 'inherit', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 13 }}>
              {artLoading ? '⟳' : '🔄 تحديث'}
            </button>
          </div>
          <div className="panel-body">
            {artLoading
              ? <p className="panel-empty">جارٍ التحميل…</p>
              : articles.length === 0
                ? <p className="panel-empty">لا توجد مقالات حالياً</p>
                : (() => { const a = articles[0]; return (
                  <div className="latest-article-card">
                    <div className="latest-art-meta">
                      <span className="art-tag">{a.category || 'عام'}</span>
                      <span className="latest-art-date">{a.created_at ? new Date(a.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                    </div>
                    <h3 className="latest-art-title">{a.title}</h3>
                    <p className="latest-art-excerpt">{(a.content || '').substring(0, 180)}{(a.content || '').length > 180 ? '…' : ''}</p>
                    {a.author && <p className="latest-art-author">بقلم: {a.author}</p>}
                  </div>
                ); })()}
          </div>
          <div className="panel-foot">
            <button className="panel-btn blue" onClick={() => navigate('/articles')}>عرض جميع المقالات →</button>
          </div>
        </div>

        {/* Panel 2 — Awareness Sections */}
        <div className="panel-card">
          <div className="panel-head panel-head-green">
            <span className="panel-head-icon">🧠</span>
            <h2>أقسام التوعية</h2>
          </div>
          <div className="panel-body">
            <div className="awareness-grid">
              {AWARENESS_SECTIONS.map((s, i) => (
                <button key={i} className="aware-btn" onClick={() => navigate(`/awareness/${s.slug}`)}>
                  <span className="aware-icon"><AppIcon name={s.icon} size={18} /></span>
                  <span className="aware-title">{s.title}</span>
                  <span className="aware-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3 — Trending Rumors */}
        <div className="panel-card">
          <div className="panel-head panel-head-red">
            <span className="panel-head-icon">🚨</span>
            <h2>الشائعات المتداولة</h2>
          </div>
          <div className="panel-body">
            {rumorLoading
              ? <p className="panel-empty">جارٍ التحميل…</p>
              : rumors.length === 0
                ? <p className="panel-empty">لا توجد شائعات مرصودة حالياً</p>
                : <div className="art-list">{rumors.slice(0, 5).map((r, i) => (
                    <div key={i} className="art-row">
                      <span className="art-tag red">{r.type === 'world-rumor' ? 'رصد عالمي' : 'شائعة'}</span>
                      <span className="art-row-title">{r.title}</span>
                    </div>
                  ))}</div>
            }
          </div>
          <div className="panel-foot">
            <button className="panel-btn red" onClick={() => navigate('/articles?category=rumors')}>عرض جميع الشائعات →</button>
          </div>
        </div>

        {/* Panel 4 — Quick Actions */}
        <div className="panel-card">
          <div className="panel-head panel-head-gold">
            <span className="panel-head-icon">⚡</span>
            <h2>الإجراءات السريعة</h2>
          </div>
          <div className="panel-body quick-actions">
            {[
              { icon: '🔍', label: 'تحقق من خبر بالذكاء الاصطناعي', path: '/ai-detect',  color: '#2563eb' },
              { icon: '📢', label: 'إرسال بلاغ جديد',               path: '/report',    color: '#dc2626' },
              { icon: '💬', label: 'محادثة مع الذكاء الاصطناعي',    path: '/ai-chat',   color: '#7c3aed' },
              { icon: '📊', label: 'عرض الإحصائيات التفصيلية',      path: '/stats',     color: '#059669' },
              { icon: '📋', label: 'استعراض البلاغات',              path: '/reports',   color: '#d97706' },
              { icon: '📰', label: 'قراءة المقالات التوعوية',        path: '/articles',  color: '#0891b2' },
            ].map((a, i) => (
              <button key={i} className="qa-btn" onClick={() => navigate(a.path)}
                style={{ borderRight: `3px solid ${a.color}` }}>
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Field Photos Gallery ── */}
      <section className="field-section">
        <div className="field-head">
          <h2 className="field-title">📸 صور مضافة</h2>
          {isAdmin && (
            <button className="field-add-btn" onClick={() => setShowFieldForm(v => !v)}>
              {showFieldForm ? '✖ إغلاق' : '➕ إضافة صورة'}
            </button>
          )}
        </div>

        {showFieldForm && isAdmin && (
          <form className="field-form" onSubmit={addFieldInterview}>
            <input
              className="field"
              placeholder="عنوان الصورة الميدانية"
              value={fieldForm.title}
              onChange={e => setFieldForm(f => ({ ...f, title: e.target.value }))}
            />
            <label style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>اختر صورة من جهازك</label>
            <input
              className="field"
              type="file"
              accept="image/*"
              onChange={e => setFieldForm(f => ({ ...f, imageFile: e.target.files?.[0] || null }))}
              style={{ padding: '6px 0' }}
            />
            {fieldForm.imageFile && (
              <div style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>
                سيتم رفع: {fieldForm.imageFile.name}
              </div>
            )}
            <button className="btn-save" type="submit">حفظ الصورة</button>
          </form>
        )}

        {fieldMsg && <p style={{ color: fieldMsg.includes('تمت') ? '#059669' : '#dc2626', fontSize: 13, margin: '6px 0' }}>{fieldMsg}</p>}

        {fieldInterviews.length === 0
          ? <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>لا توجد صور مضافة بعد</p>
          : (
            <div className="field-gallery">
              {fieldInterviews.map(x => (
                <div key={x.interview_id} className="field-card">
                  {x.image_url
                    ? <img
                        src={x.image_url.startsWith('http') ? x.image_url : `${API_BASE}${x.image_url}`}
                        alt={x.title}
                        className="field-img"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    : <div className="field-img-placeholder">📸</div>
                  }
                  <div className="field-card-body">
                    <div className="field-card-title">{x.title}</div>
                    {x.place && <div className="field-card-place">📍 {x.place}</div>}
                    {isAdmin && (
                      <button className="field-del-btn" onClick={() => deleteFieldInterview(x.interview_id)}>حذف</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>

    </div>
  );
}
