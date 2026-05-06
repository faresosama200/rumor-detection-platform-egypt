import { useState, useEffect } from 'react';
import api from './api';

const EMPTY = { title: '', content: '', category: 'awareness', tags: '', image_url: '', imageFile: null, is_published: true };

function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg]           = useState('');
  const [loading, setLoading]   = useState(true);

  const load = () => {
    api.get('/api/articles')
      .then(r => setArticles(r.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async e => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('category', form.category);
      fd.append('tags', form.tags || '');
      fd.append('is_published', form.is_published ? '1' : '0');
      if (form.image_url) fd.append('image_url', form.image_url);
      if (form.imageFile) fd.append('image', form.imageFile);
      if (editing) {
        await api.put('/api/articles/' + editing, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('✅ تم تعديل المقال');
      } else {
        await api.post('/api/articles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('✅ تم إضافة المقال');
      }
      setForm(EMPTY); setEditing(null); setShowForm(false); load();
    } catch (ex) { setMsg('❌ ' + (ex.response?.data?.message || 'خطأ')); }
  };

  const del = async id => {
    if (!window.confirm('حذف المقال؟')) return;
    await api.delete('/api/articles/' + id).catch(() => {});
    load();
  };

  const edit = a => {
    setForm({ title: a.title, content: a.content, category: a.category || 'awareness', tags: a.tags || '', image_url: a.image_url || '', imageFile: null, is_published: !!a.is_published });
    setEditing(a.article_id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📝 إدارة المقالات</h2>
        <button className="btn btn-warning mt-2" onClick={() => { setShowForm(s => !s); setForm(EMPTY); setEditing(null); }}>
          {showForm ? '✕ إغلاق' : '+ مقال جديد'}
        </button>
      </div>

      {msg && <div className="alert alert-info mb-3" onClick={() => setMsg('')}>{msg}</div>}

      {showForm && (
        <form onSubmit={save} className="card-form mb-4">
          <h5>{editing ? 'تعديل المقال' : 'مقال جديد'}</h5>
          <div className="form-group mt-3">
            <label>العنوان *</label>
            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group mt-3">
            <label>المحتوى *</label>
            <textarea className="form-control" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
          </div>
                    <div className="form-group mt-3">
            <label>صورة المقال (اختياري)</label>
            <div className="d-flex gap-2 align-items-center mb-2">
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={e => setForm({ ...form, imageFile: e.target.files[0] || null, image_url: '' })}
              />
              <span style={{color:'#999',fontSize:13,whiteSpace:'nowrap'}}>أو</span>
              <input
                className="form-control"
                value={form.image_url}
                onChange={e => setForm({ ...form, image_url: e.target.value, imageFile: null })}
                placeholder="رابط صورة مباشر..."
              />
            </div>
            {form.imageFile && (
              <div style={{fontSize:13,color:'#555',marginBottom:4}}>سيتم رفع: {form.imageFile.name}</div>
            )}
            {form.image_url && !form.imageFile && (
              <img src={form.image_url} alt="معاينة" style={{ marginTop: 4, maxHeight: 120, borderRadius: 6, border: '1px solid #ddd' }} onError={e => e.target.style.display='none'} />
            )}
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <label>الفئة</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="awareness">توعية</option>
                <option value="education">تعليم</option>
                <option value="health">صحة</option>
                <option value="politics">سياسة</option>
                <option value="security">أمن</option>
              </select>
            </div>
            <div className="col-md-6">
              <label>الوسوم</label>
              <input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="وسم1، وسم2" />
            </div>
          </div>
          <div className="form-check mt-3">
            <input className="form-check-input" type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
            <label className="form-check-label" htmlFor="pub">منشور</label>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-success">{editing ? 'حفظ التعديلات' : 'نشر المقال'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>إلغاء</button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-dark">
            <tr><th>العنوان</th><th>الفئة</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.article_id}>
                <td>{a.title}</td>
                <td><span className="badge bg-secondary">{a.category}</span></td>
                <td><span className={`badge ${a.is_published ? 'bg-success' : 'bg-warning'}`}>{a.is_published ? 'منشور' : 'مسودة'}</span></td>
                <td>{a.created_at ? new Date(a.created_at).toLocaleDateString('ar-EG') : '-'}</td>
                <td>
                  <button className="btn btn-sm btn-outline-warning me-1" onClick={() => edit(a)}>تعديل</button>
                  <button className="btn btn-sm btn-outline-danger"       onClick={() => del(a.article_id)}>حذف</button>
                </td>
              </tr>
            ))}
            {articles.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-3">لا توجد مقالات بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminArticles;
