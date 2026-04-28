import React, { useState, useEffect } from 'react';
import api from './api';
import { useAuth } from './auth';

const EMPTY = { title: '', content: '', category: 'awareness', tags: '', is_published: true };

export default function AdminArticles() {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const [articles, setArticles] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    const headers = { headers: { Authorization: `Bearer ${token}` } };

    const load = async () => {
        try {
            const { data } = await api.get('/api/articles');
            setArticles(Array.isArray(data) ? data : (data.articles || []));
        } catch(e) { setMsg('خطأ في تحميل المقالات'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        setMsg('');
        try {
            if (editing) {
                await api.put(`/api/articles/${editing}`, form, headers);
                setMsg('تم تحديث المقال ✔');
            } else {
                await api.post('/api/articles', form, headers);
                setMsg('تم إضافة المقال ✔');
            }
            setForm(EMPTY);
            setEditing(null);
            load();
        } catch(e) {
            setMsg(e?.response?.data?.error || 'خطأ في الحفظ');
        }
    };

    const del = async (id) => {
        if (!window.confirm('حذف المقال؟')) return;
        try {
            await api.delete(`/api/articles/${id}`, headers);
            setMsg('تم الحذف');
            load();
        } catch(e) { setMsg('خطأ في الحذف'); }
    };

    const edit = (a) => {
        setForm({ title: a.title, content: a.content, category: a.category || 'awareness', tags: a.tags || '', is_published: !!a.is_published });
        setEditing(a.id);
        window.scrollTo(0, 0);
    };

    return (
        <div className="admin-articles">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>
                {editing ? 'تعديل مقال' : 'إضافة مقال جديد'}
            </h2>
            {msg && <div className={msg.includes('✔') ? 'alert alert-success' : 'alert alert-danger'}>{msg}</div>}
            <form onSubmit={save} style={{ background: '#fff', padding: 20, borderRadius: 10, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                <div className="form-group">
                    <label>العنوان *</label>
                    <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                    <label>المحتوى *</label>
                    <textarea className="form-control" rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                        <label>الفئة</label>
                        <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            <option value="awareness">توعية</option>
                            <option value="health">صحة</option>
                            <option value="technology">تكنولوجيا</option>
                            <option value="politics">سياسة</option>
                            <option value="economy">اقتصاد</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                        <label>الوسوم (مفصولة بفاصلة)</label>
                        <input className="form-control" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="مثال: صحة,توعية" />
                    </div>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                    <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <label htmlFor="pub" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 500 }}>نشر المقال على الفور</label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button type="submit" className="btn btn-primary">{editing ? 'حفظ التعديل' : 'إضافة المقال'}</button>
                    {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY); }}>إلغاء</button>}
                </div>
            </form>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>المقالات المنشورة ({articles.length})</h3>
            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : articles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>لا توجد مقالات بعد</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table table-hover" style={{ background: '#fff', borderRadius: 10 }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th>العنوان</th>
                                <th>الفئة</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map(a => (
                                <tr key={a.id}>
                                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</td>
                                    <td><span className="badge bg-info text-dark">{a.category || 'عام'}</span></td>
                                    <td><span className={`badge ${a.is_published ? 'bg-success' : 'bg-warning text-dark'}`}>{a.is_published ? 'منشور' : 'مسودة'}</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary" style={{ marginInlineEnd: 6 }} onClick={() => edit(a)}>تعديل</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => del(a.id)}>حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
