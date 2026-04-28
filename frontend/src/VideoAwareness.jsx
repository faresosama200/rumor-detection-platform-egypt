import React, { useState, useEffect } from 'react';
import api from './api';
import { useAuth } from './auth';

const PLATFORM_LABELS = {
    youtube: '▶ YouTube',
    facebook: 'f Facebook',
    tiktok: '♪ TikTok',
    other: '🔗 أخرى'
};

function getYouTubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

export default function VideoAwareness() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const token = localStorage.getItem('token');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', url: '', platform: 'youtube' });
    const [msg, setMsg] = useState('');

    const load = async () => {
        try {
            const { data } = await api.get('/api/videos');
            setVideos(Array.isArray(data) ? data : (data.videos || []));
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const addVideo = async (e) => {
        e.preventDefault();
        setMsg('');
        try {
            await api.post('/api/videos', form, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('تم إضافة الفيديو ✔');
            setForm({ title: '', description: '', url: '', platform: 'youtube' });
            setShowForm(false);
            load();
        } catch(e) {
            setMsg(e?.response?.data?.error || 'خطأ في الإضافة');
        }
    };

    const delVideo = async (id) => {
        if (!window.confirm('حذف الفيديو؟')) return;
        try {
            await api.delete(`/api/videos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            load();
        } catch(e) { alert('خطأ في الحذف'); }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="video-awareness">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>فيديوهات توعوية</h2>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'إلغاء' : '+ إضافة فيديو'}
                    </button>
                )}
            </div>

            {msg && <div className={msg.includes('✔') ? 'alert alert-success' : 'alert alert-danger'}>{msg}</div>}

            {showForm && isAdmin && (
                <form onSubmit={addVideo} style={{ background: '#fff', padding: 20, borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                    <h4 style={{ marginBottom: 16 }}>إضافة فيديو جديد</h4>
                    <div className="form-group">
                        <label>عنوان الفيديو *</label>
                        <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ marginTop: 10 }}>
                        <label>وصف مختصر</label>
                        <input className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginTop: 10 }}>
                        <label>رابط الفيديو * (YouTube / Facebook / TikTok أو أي رابط)</label>
                        <input className="form-control" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." required />
                    </div>
                    <div className="form-group" style={{ marginTop: 10 }}>
                        <label>المنصة</label>
                        <select className="form-control" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                            <option value="youtube">YouTube</option>
                            <option value="facebook">Facebook</option>
                            <option value="tiktok">TikTok</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-success" style={{ marginTop: 14 }}>إضافة</button>
                </form>
            )}

            {videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                    <p>لا توجد فيديوهات توعوية بعد</p>
                    {isAdmin && <p style={{ fontSize: 14 }}>اضغط "إضافة فيديو" لإضافة أول فيديو</p>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {videos.map(v => {
                        const ytId = v.platform === 'youtube' ? getYouTubeId(v.url) : null;
                        return (
                            <div key={v.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.1)' }}>
                                {ytId ? (
                                    <iframe
                                        width="100%"
                                        height="200"
                                        src={`https://www.youtube.com/embed/${ytId}`}
                                        title={v.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ display: 'block' }}
                                    />
                                ) : (
                                    <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', background: '#f0f4ff', height: 200, alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                        <span style={{ fontSize: 48 }}>▶</span>
                                    </a>
                                )}
                                <div style={{ padding: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, flex: 1 }}>{v.title}</h4>
                                        <span style={{ fontSize: 11, background: '#e8f4fd', color: '#1976d2', padding: '2px 8px', borderRadius: 12, marginInlineStart: 8, whiteSpace: 'nowrap' }}>
                                            {PLATFORM_LABELS[v.platform] || v.platform}
                                        </span>
                                    </div>
                                    {v.description && <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>{v.description}</p>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                        <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1976d2' }}>مشاهدة ↗</a>
                                        {isAdmin && (
                                            <button onClick={() => delVideo(v.id)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 13 }}>حذف</button>
                                        )}
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
