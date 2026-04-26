import { useEffect, useState } from 'react';
import { api } from './api';
import { useNotifications } from './Notifications';

function ExternalLinksPage() {
  const { error } = useNotifications();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/external-links');
      setLinks(response.data.links || []);
    } catch (err) {
      error('فشل تحميل الروابط: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(links.map((link) => link.category)));
  const filteredLinks = filter === 'all' ? links : links.filter((link) => link.category === filter);

  return (
    <div className="external-links-page">
      <div className="hero p-4 p-lg-5 mb-4">
        <h1 className="display-6 fw-bold mb-3">🔗 روابط موثوقة مصرية وعالمية</h1>
        <p className="text-light-emphasis mb-0">
          قائمة شاملة بالروابط الرسمية والموثوقة للجهات الحكومية المصرية والمنظمات العالمية
          والمصادر الإعلامية الموثوقة للتحقق من المعلومات والبلاغات.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setFilter('all')}
          >
            جميع الروابط ({links.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`btn btn-sm ${filter === category ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setFilter(category)}
            >
              {category} ({links.filter((l) => l.category === category).length})
            </button>
          ))}
        </div>
      </div>

      {/* Links Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredLinks.map((link) => (
            <div key={link.link_id} className="col-lg-6">
              <div className="card h-100 border-0 shadow-sm link-card">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="link-icon" style={{ fontSize: '2em' }}>
                      {link.icon}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1">{link.name}</h5>
                      <span className="badge bg-primary">{link.link_type}</span>
                      <span className="badge bg-secondary ms-2">{link.category}</span>
                    </div>
                  </div>

                  <p className="card-text text-muted small mb-3">{link.description}</p>

                  <div className="link-url mb-3">
                    <code className="text-break small text-warning">{link.url}</code>
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-warning"
                  >
                    🔗 زيارة الموقع
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="card border-warning mt-5 p-4">
        <h5 className="text-warning mb-3">⚠️ تنبيهات مهمة</h5>
        <ul>
          <li>تأكد من أن الموقع آمن قبل إدخال بيانات شخصية</li>
          <li>استخدم هذه الروابط للتحقق من المعلومات قبل نشر أي بلاغ</li>
          <li>الروابط المصرية تتخصص في المعلومات المتعلقة بمصر</li>
          <li>الروابط العالمية توفر معلومات عامة موثوقة</li>
          <li>تحديث الروابط يتم بشكل دوري من قبل المدير</li>
        </ul>
      </div>
    </div>
  );
}

export default ExternalLinksPage;
