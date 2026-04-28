import { useState, useEffect } from 'react';
import api from './api';

function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/api/articles')
      .then(r => setArticles(r.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📰 مقالات التوعية</h2>
        <p>اقرأ أحدث المقالات والتقارير حول الشائعات والمعلومات المضللة</p>
      </div>
      <input
        className="form-control mb-4"
        placeholder="🔍 ابحث في المقالات..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📰</div>
          <p>لا توجد مقالات بعد</p>
        </div>
      ) : (
        <div className="articles-grid">
          {filtered.map(a => (
            <div key={a.article_id} className="article-card">
              <span className="article-category">{a.category}</span>
              <h3>{a.title}</h3>
              <p>{a.content?.substring(0, 180)}...</p>
              <div className="article-footer">
                <span>{a.author || 'الفريق التحريري'}</span>
                <span>{a.created_at ? new Date(a.created_at).toLocaleDateString('ar-EG') : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const articlesData = [];
export default ArticlesPage;
