import { useState } from 'react';
import api from './api';

function ReportPage() {
  const [form, setForm] = useState({ title: '', description: '', source_url: '', category: 'general', tags: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg(''); setErr(''); setLoading(true);
    try {
      await api.post('/api/reports', form);
      setMsg('✅ تم إرسال البلاغ بنجاح. سيتم مراجعته من الفريق.');
      setForm({ title: '', description: '', source_url: '', category: 'general', tags: '' });
    } catch (ex) {
      setErr(ex.response?.data?.message || 'حدث خطأ أثناء الإرسال');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📢 الإبلاغ عن شائعة</h2>
        <p>ساهم في محاربة المعلومات المضللة بإبلاغنا عن أي شائعة أو خبر مزيف</p>
      </div>
      <div className="card-form">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>عنوان الشائعة *</label>
            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="اكتب عنوان الشائعة..." />
          </div>
          <div className="form-group mt-3">
            <label>تفاصيل الشائعة *</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="اشرح الشائعة بالتفصيل..." />
          </div>
          <div className="form-group mt-3">
            <label>رابط المصدر (اختياري)</label>
            <input className="form-control" value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <label>التصنيف</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="general">عام</option>
                <option value="health">صحة</option>
                <option value="politics">سياسة</option>
                <option value="economy">اقتصاد</option>
                <option value="security">أمن</option>
                <option value="religion">دين</option>
              </select>
            </div>
            <div className="col-md-6">
              <label>الوسوم (اختياري)</label>
              <input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="شائعة، صحة، ..." />
            </div>
          </div>
          <button className="btn btn-warning w-100 mt-4" type="submit" disabled={loading}>
            {loading ? 'جارٍ الإرسال...' : '📤 إرسال البلاغ'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportPage;
