import { useState, useEffect } from 'react';
import api from './api';

const LABELS = { youtube: '▶ YouTube', facebook: 'f Facebook', tiktok: '♪ TikTok', other: '🔗 أخرى' };

function getYTId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function VideoAwareness() {
  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ title: '', description: '', url: '', platform: 'youtube' });
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg]           = useState('');
  const role   = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const load = () => {
    api.get('/api/videos')
      .then(r => setVideos(r.data || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addVideo = async e => {
    e.preventDefault();
    try {
      await api.post('/api/videos', { title: form.title, description: form.description, video_url: form.url, platform: form.platform });
      setMsg('✅ تم إضافة الفيديو');
      setForm({ title: '', description: '', url: '', platform: 'youtube' });
      setShowForm(false);
      load();
    } catch (ex) { setMsg('❌ ' + (ex.response?.data?.message || 'خطأ')); }
  };

  const delVideo = async id => {
    if (!window.confirm('حذف الفيديو؟')) return;
    await api.delete('/api/videos/' + id).catch(() => {});
    load();
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🎬 فيديوهات التوعية</h2>
        <p>شاهد فيديوهات توعوية حول الشائعات والمعلومات المضللة</p>
        {isAdmin && (
          <button className="btn btn-warning mt-2" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ إغلاق' : '+ إضافة فيديو'}
          </button>
        )}
      </div>

      {msg && <div className="alert alert-info mb-3">{msg}</div>}

      {isAdmin && showForm && (
        <form onSubmit={addVideo} className="card-form mb-4">
          <h5>إضافة فيديو جديد</h5>
          <div className="form-group mt-3">
            <label>عنوان الفيديو *</label>
            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group mt-3">
            <label>وصف (اختياري)</label>
            <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group mt-3">
            <label>رابط الفيديو * (YouTube / Facebook / TikTok أو أي رابط)</label>
            <input className="form-control" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div className="form-group mt-3">
            <label>المنصة</label>
            <select className="form-control" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success mt-3">إضافة</button>
        </form>
      )}

      {videos.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🎬</div>
          <p>لا توجد فيديوهات توعوية بعد</p>
          {isAdmin && <p style={{ fontSize: 14 }}>اضغط "+ إضافة فيديو" لإضافة أول فيديو</p>}
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map(v => {
            const ytId = v.platform === 'youtube' ? getYTId(v.video_url || v.url || '') : null;
            return (
              <div key={v.video_id} className="video-card">
                {ytId ? (
                  <iframe
                    width="100%" height="200"
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={v.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block' }}
                  />
                ) : (
                  <a href={v.video_url || v.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', background: '#f0f4ff', height: 200, alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <span style={{ fontSize: 48 }}>▶</span>
                  </a>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, flex: 1 }}>{v.title}</h4>
                    <span style={{ fontSize: 11, background: '#e8f4fd', color: '#1976d2', padding: '2px 8px', borderRadius: 12, marginInlineStart: 8, whiteSpace: 'nowrap' }}>
                      {LABELS[v.platform] || v.platform}
                    </span>
                  </div>
                  {v.description && <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>{v.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <a href={v.video_url || v.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1976d2' }}>مشاهدة ↗</a>
                    {isAdmin && <button onClick={() => delVideo(v.video_id)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 13 }}>حذف</button>}
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

export default VideoAwareness;
