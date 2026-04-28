import { useState, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './auth.jsx';

export default function VideoAwareness() {
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', platform: 'youtube' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await api.get('/videos');
      setVideos(res.data.videos || []);
    } catch(e) { setVideos([]); } finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) { setMsg('يرجى ملء العنوان والرابط'); return; }
    setSubmitting(true); setMsg('');
    try {
      await api.post('/videos', form);
      setMsg('تمت الإضافة بنجاح!');
      setForm({ title: '', description: '', video_url: '', platform: 'youtube' });
      setShowForm(false);
      fetchVideos();
    } catch(e) { setMsg('حدث خطأ، حاول مجدداً'); } finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('تأكيد حذف الفيديو؟')) return;
    try { await api.delete('/videos/' + id); fetchVideos(); } catch(e) {}
  }

  function getEmbedUrl(url, platform) {
    if (!url) return null;
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const ytId = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
        return ytId ? 'https://www.youtube.com/embed/' + ytId : null;
      }
      if (url.includes('facebook.com')) {
        return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url);
      }
    } catch(e) {}
    return null;
  }

  const platforms = { youtube: '▶ يوتيوب', tiktok: '🎵 تيك توك', facebook: '👥 فيسبوك', other: '🔗 رابط' };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">🎬 فيديوهات توعوية</h2>
          <p className="text-muted mb-0">مقاطع فيديو تثقيفية حول الشائعات والتحقق من المعلومات</p>
        </div>
        {isAdmin && (
          <button className="btn btn-warning" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ إلغاء' : '➕ إضافة فيديو'}
          </button>
        )}
      </div>

      {msg && <div className={'alert ' + (msg.includes('نجاح') ? 'alert-success' : 'alert-danger') + ' mb-3'}>{msg}</div>}

      {showForm && isAdmin && (
        <div className="card border-0 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3">إضافة فيديو جديد</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">عنوان الفيديو *</label>
                <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="عنوان الفيديو" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">المنصة</label>
                <select className="form-select" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                  <option value="youtube">يوتيوب</option>
                  <option value="facebook">فيسبوك</option>
                  <option value="tiktok">تيك توك</option>
                  <option value="other">منصة أخرى</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">رابط الفيديو *</label>
                <input className="form-control" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." required />
              </div>
              <div className="col-12">
                <label className="form-label">وصف الفيديو</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="وصف مختصر" />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-warning" disabled={submitting}>
                  {submitting ? '⏳ جارٍ الحفظ...' : '💾 حفظ الفيديو'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-warning"></div><p className="mt-2">جارٍ التحميل...</p></div>
      ) : videos.length === 0 ? (
        <div className="text-center py-5">
          <div style={{fontSize:'4rem'}}>🎬</div>
          <p className="text-muted mt-2">لا توجد فيديوهات بعد{isAdmin ? '. أضف أول فيديو!' : ''}</p>
        </div>
      ) : (
        <div className="row g-4">
          {videos.map(v => {
            const embedUrl = getEmbedUrl(v.video_url, v.platform);
            return (
              <div key={v.video_id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  {embedUrl ? (
                    <div className="ratio ratio-16x9">
                      <iframe src={embedUrl} title={v.title} allowFullScreen style={{borderRadius:'8px 8px 0 0'}} />
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center bg-dark text-warning" style={{height:'180px', borderRadius:'8px 8px 0 0', fontSize:'3rem'}}>🎬</div>
                  )}
                  <div className="card-body">
                    <h5 className="card-title fw-bold">{v.title}</h5>
                    {v.description && <p className="card-text text-muted small">{v.description}</p>}
                    <div className="d-flex align-items-center justify-content-between mt-2 flex-wrap gap-2">
                      <span className="badge bg-warning text-dark">{platforms[v.platform] || v.platform}</span>
                      <div className="d-flex gap-2">
                        <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-warning">فتح الرابط</a>
                        {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(v.video_id)}>حذف</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
