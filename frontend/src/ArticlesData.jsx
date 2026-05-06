import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from './api';

const CATS = [
  { label: 'الكل',            value: '',           icon: '📚' },
  { label: 'توعوي عام',       value: 'awareness',   icon: '💡' },
  { label: 'الوالدين',        value: 'parents',     icon: '👨‍👩‍👧' },
  { label: 'الأطفال',         value: 'children',    icon: '🧒' },
  { label: 'الديني',          value: 'religious',   icon: '🕌' },
  { label: 'سياسي',           value: 'political',   icon: '🏛️' },
  { label: 'فني',             value: 'art',         icon: '🎨' },
  { label: 'ثقافي',           value: 'culture',     icon: '📚' },
  { label: 'تجاري',           value: 'commercial',  icon: '💼' },
  { label: 'زراعي',           value: 'agriculture', icon: '🌾' },
  { label: 'الشائعات',        value: 'rumors',      icon: '🚨' },
];
const CAT_MAP = Object.fromEntries(CATS.filter(c=>c.value).map(c=>[c.value, `${c.icon} ${c.label}`]));

export default function ArticlesPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const search    = new URLSearchParams(location.search);

  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState('');
  const [selected,  setSelected]  = useState(search.get('category') || '');
  const [expanded,  setExpanded]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ title: '', content: '', category: 'awareness', tags: '' });
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);

  const token   = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('role') === 'admin';

  // Sync category from URL
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category') || '';
    setSelected(cat);
  }, [location.search]);

  // Fetch articles
  useEffect(() => {
    setLoading(true);
    const url = `${API_BASE}/api/articles${selected ? '?category=' + encodeURIComponent(selected) : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setArticles(Array.isArray(d) ? d : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [selected]);

  const filtered = articles.filter(a =>
    !query || a.title?.includes(query) || a.content?.includes(query)
  );

  const selectCat = val => {
    navigate('/articles' + (val ? '?category=' + val : ''));
  };

  const addArticle = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMsg({ type: 'error', text: 'العنوان والمحتوى مطلوبان' }); return; }
    if (!token) { setMsg({ type: 'error', text: 'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.' }); return; }
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ ...form, is_published: true }),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg({ type: 'success', text: '✅ تم إضافة المقال بنجاح' });
        setForm({ title: '', content: '', category: 'awareness', tags: '' });
        setShowForm(false);
        // Refresh list
        const res = await fetch(`${API_BASE}/api/articles${selected ? '?category=' + selected : ''}`);
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } else if (r.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('userId');
        setMsg({ type: 'error', text: 'رمز الدخول غير صالح. سجل الدخول مرة أخرى ثم أضف المقال.' });
      } else {
        setMsg({ type: 'error', text: d.message || 'حدث خطأ' });
      }
    } catch { setMsg({ type: 'error', text: 'خطأ في الاتصال بالخادم' }); }
    setSaving(false);
  };

  const delArticle = async id => {
    if (!window.confirm('هل تريد حذف هذا المقال نهائياً؟')) return;
    await fetch(`${API_BASE}/api/articles/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    setArticles(prev => prev.filter(a => a.article_id !== id));
  };

  return (
    <div className="page-wrap">
      {/* Page Header */}
      <div className="page-hero">
        <h1>📰 المقالات والمحتوى التوعوي</h1>
        <p>محتوى موثوق ومحقق لمكافحة الشائعات والمعلومات المضللة</p>
      </div>

      {/* Category Tabs */}
      <div className="cat-tabs-wrap">
        <div className="cat-tabs">
          {CATS.map(c => (
            <button key={c.value}
              className={`cat-tab ${selected === c.value ? 'active' : ''}`}
              onClick={() => selectCat(c.value)}
            >
              {c.icon && <span>{c.icon}</span>} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-box"
            type="text"
            placeholder="ابحث في المقالات..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button className="btn-add" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ إلغاء' : '＋ مقال جديد'}
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdmin && showForm && (
        <div className="add-form-card">
          <h3>✍️ إضافة مقال جديد</h3>
          <div className="form-grid">
            <input className="field" placeholder="عنوان المقال *"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <select className="field"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <textarea className="field" placeholder="محتوى المقال * (يمكن كتابة HTML)" rows={6}
            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          <input className="field" placeholder="وسوم (مفصولة بفواصل)"
            value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          <div className="form-actions">
            <button className="btn-save" onClick={addArticle} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Message */}
      {msg && <div className={`inline-msg ${msg.type}`}>{msg.text}</div>}

      {/* Articles */}
      {loading ? (
        <div className="center-loader"><span className="spin" />جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">
          <span>📭</span>
          <p>لا توجد مقالات {selected ? 'في هذا التصنيف' : ''}</p>
          {isAdmin && <button className="btn-add" onClick={() => setShowForm(true)}>+ أضف أول مقال</button>}
        </div>
      ) : (
        <div className="articles-grid">
          {filtered.map(a => (
            <article key={a.article_id} className="article-card">
              <div className="article-card-top">
                <span className="cat-badge">{CAT_MAP[a.category] || a.category || '📄 عام'}</span>
                {isAdmin && <button className="btn-del" onClick={() => delArticle(a.article_id)} title="حذف">🗑️</button>}
              </div>
              <h3 className="article-card-title">{a.title}</h3>
              <div className="article-card-meta">
                {a.author && <span>✍️ {a.author}</span>}
                <span>📅 {a.created_at ? new Date(a.created_at).toLocaleDateString('ar-EG') : '—'}</span>
              </div>
              <div
                className="article-card-body"
                dangerouslySetInnerHTML={{
                  __html: expanded === a.article_id
                    ? a.content
                    : (a.content || '').replace(/<[^>]+>/g, '').substring(0, 180) + ((a.content || '').length > 180 ? '...' : '')
                }}
              />
              <button className="btn-expand" onClick={() => setExpanded(e => e === a.article_id ? null : a.article_id)}>
                {expanded === a.article_id ? 'إخفاء ▲' : 'قراءة المزيد ▼'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
