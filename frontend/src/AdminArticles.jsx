import { useState, useEffect } from 'react';
import { api } from './api';

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'توعية', tags: '', is_published: 1 });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchArticles(); }, []);

  async function fetchArticles() {
    setLoading(true);
    try {
      const res = await api.get('/articles');
      setArticles(res.data.articles || []);
    } catch(e) { setArticles([]); } finally { setLoading(false); }
  }

  function openNew() { setEditItem(null); setForm({ title:'', content:'', category:'توعية', tags:'', is_published:1 }); setShowForm(true); setMsg(''); }
  function openEdit(a) { setEditItem(a); setForm({ title:a.title, content:a.content, category:a.category||'توعية', tags:a.tags||'', is_published:a.is_published }); setShowForm(true); setMsg(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setMsg('يرجى ملء العنوان والمحتوى'); return; }
    try {
      if (editItem) {
        await api.put('/articles/' + editItem.article_id, form);
        setMsg('تم التحديث بنجاح!');
      } else {
        await api.post('/articles', form);
        setMsg('تمت الإضافة بنجاح!');
      }
      setShowForm(false); fetchArticles();
    } catch(e) { setMsg('حدث خطأ، حاول مجدداً'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('تأكيد حذف المقال؟')) return;
    try { await api.delete('/articles/' + id); fetchArticles(); } catch(e) {}
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">📚 إدارة المقالات</h2>
          <p className="text-muted mb-0">إضافة وتعديل وحذف المقالات التوعوية</p>
        </div>
        <button className="btn btn-warning" onClick={openNew}>➕ مقال جديد</button>
      </div>

      {msg && <div className={'alert ' + (msg.includes('نجاح') ? 'alert-success' : 'alert-danger') + ' mb-3'}>{msg}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">{editItem ? 'تعديل المقال' : 'إضافة مقال جديد'}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">عنوان المقال *</label>
                <input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان واضح ومختصر" required />
              </div>
              <div className="col-md-4">
                <label className="form-label">التصنيف</label>
                <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  <option>توعية</option><option>تحقق</option><option>إعلام</option><option>تقنية</option><option>أمن معلومات</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">محتوى المقال *</label>
                <textarea className="form-control" rows={6} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="اكتب محتوى المقال هنا..." required />
              </div>
              <div className="col-md-8">
                <label className="form-label">الوسوم (افصل بفاصلة)</label>
                <input className="form-control" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="شائعات, تحقق, توعية" />
              </div>
              <div className="col-md-4">
                <label className="form-label">الحالة</label>
                <select className="form-select" value={form.is_published} onChange={e=>setForm({...form,is_published:parseInt(e.target.value)})}>
                  <option value={1}>منشور</option><option value={0}>مسودة</option>
                </select>
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-warning">{editItem ? '💾 حفظ التعديلات' : '➕ نشر المقال'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={()=>setShowForm(false)}>إلغاء</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-warning"></div></div>
      ) : (
        <div className="row g-3">
          {articles.map(a => (
            <div key={a.article_id} className="col-12">
              <div className="card border-0 shadow-sm p-3">
                <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <h5 className="mb-0 fw-bold">{a.title}</h5>
                      <span className={'badge ' + (a.is_published ? 'bg-success' : 'bg-secondary')}>{a.is_published ? 'منشور' : 'مسودة'}</span>
                      <span className="badge bg-warning text-dark">{a.category}</span>
                    </div>
                    <p className="text-muted small mb-0" style={{maxHeight:'60px',overflow:'hidden'}}>{a.content}</p>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0">
                    <button className="btn btn-sm btn-outline-warning" onClick={()=>openEdit(a)}>✏️ تعديل</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(a.article_id)}>🗑️ حذف</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {articles.length === 0 && <div className="col-12 text-center py-4 text-muted">لا توجد مقالات بعد. أضف أول مقال!</div>}
        </div>
      )}
    </div>
  );
}
