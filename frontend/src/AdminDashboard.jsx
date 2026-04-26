import { useEffect, useMemo, useState } from 'react';
import { api, endpoints } from './api';
import { useAuth } from './auth';
import { useContentSettings } from './contentSettings';

const createLink = () => ({
  name: '',
  url: 'https://',
  description: '',
  icon: '🔗',
  category: 'مصدر',
});

const createCategory = (index) => ({
  id: `custom-${index + 1}`,
  name: `فئة ${index + 1}`,
  icon: '📁',
});

function AdminDashboard() {
  const { user } = useAuth();
  const { settings, updateSettings, restoreDefaults, defaultSettings } = useContentSettings();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    trueReports: 0,
    falseReports: 0,
    totalArticles: 0,
    totalSources: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [draft, setDraft] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    let mounted = true;

    Promise.all([api.get(endpoints.dashboard), api.get(endpoints.reports)])
      .then(([dashboardRes, reportsRes]) => {
        if (!mounted) return;

        setStats({
          totalReports: dashboardRes.data?.totalReports || 0,
          pendingReports: dashboardRes.data?.pendingReports || 0,
          trueReports: dashboardRes.data?.trueReports || 0,
          falseReports: dashboardRes.data?.falseReports || 0,
          totalArticles: dashboardRes.data?.totalArticles || 0,
          totalSources: dashboardRes.data?.totalSources || 0,
        });
        setRecentReports((reportsRes.data?.reports || []).slice(0, 5));
      })
      .catch(() => {
        if (!mounted) return;
        setRecentReports([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const syncedSummary = useMemo(() => ({
    totalLinks: draft.externalLinks.length,
    totalCategories: draft.categories.filter((category) => category.id !== 'all').length,
  }), [draft]);

  const saveSettings = () => {
    setIsSaving(true);
    const saved = updateSettings(draft);
    setDraft(saved);
    setFeedback('تم حفظ الإعدادات ومزامنتها مع الواجهة بنجاح.');
    setIsSaving(false);
  };

  const resetSettings = () => {
    const defaults = restoreDefaults();
    setDraft(defaults);
    setFeedback('تمت إعادة ضبط إعدادات المحتوى إلى القيم الافتراضية.');
  };

  const resetEgyptianLinks = () => {
    setDraft((current) => ({
      ...current,
      externalLinks: defaultSettings.externalLinks.map((link) => ({ ...link })),
    }));
    setFeedback('تم استرجاع قائمة الروابط المصرية/العالمية الافتراضية. اضغط حفظ الإعدادات لتطبيقها.');
  };

  const updatePlatformField = (field, value) => {
    setDraft((current) => ({
      ...current,
      platform: {
        ...current.platform,
        [field]: value,
      },
    }));
  };

  const updateLinkField = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      externalLinks: current.externalLinks.map((link, linkIndex) => (
        linkIndex === index ? { ...link, [field]: value } : link
      )),
    }));
  };

  const removeLink = (index) => {
    setDraft((current) => ({
      ...current,
      externalLinks: current.externalLinks.filter((_, linkIndex) => linkIndex !== index),
    }));
  };

  const addLink = () => {
    setDraft((current) => ({
      ...current,
      externalLinks: [...current.externalLinks, createLink()],
    }));
  };

  const updateCategoryField = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) => (
        categoryIndex === index ? { ...category, [field]: value } : category
      )),
    }));
  };

  const addCategory = () => {
    setDraft((current) => ({
      ...current,
      categories: [...current.categories, createCategory(current.categories.length)],
    }));
  };

  const removeCategory = (index) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.filter((category, categoryIndex) => (
        category.id === 'all' ? true : categoryIndex !== index
      )),
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
          🛡️ لوحة تحكم المدير
          </h1>
          <p className="text-muted mb-0">مرحباً {user?.name || 'مدير النظام'} - أي تعديل هنا ينعكس مباشرة على الواجهة.</p>
        </div>
        <div className="badge bg-danger fs-6">مدير النظام</div>
      </div>

      {feedback && (
        <div className="alert alert-success border-0 shadow-sm" role="alert">
          {feedback}
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i className="bi bi-people-fill text-warning fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">إجمالي البلاغات</h6>
                <h3 className="mb-0 text-warning">{stats.totalReports.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">قيد المراجعة</h6>
                <h3 className="mb-0 text-warning">{stats.pendingReports.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i className="bi bi-clock-fill text-warning fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">المقالات المنشورة</h6>
                <h3 className="mb-0 text-warning">{stats.totalArticles.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i className="bi bi-check-circle-fill text-warning fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">الروابط الموثوقة المتزامنة</h6>
                <h3 className="mb-0 text-warning">{syncedSummary.totalLinks.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">📊 أحدث البلاغات</h5>
            <div className="table-responsive">
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>التصنيف</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title || report.claim_text || 'بلاغ بدون عنوان'}</td>
                      <td>
                        <span className="badge bg-secondary">{report.category || report.claim_category || 'عام'}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          report.status === 'pending' ? 'bg-warning' :
                          report.status === 'true' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {report.status === 'pending' ? 'قيد المراجعة' :
                           report.status === 'true' ? 'صحيح' : 'مضلل'}
                        </span>
                      </td>
                      <td>{report.created_at ? new Date(report.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-warning me-1" type="button">عرض</button>
                        <button className="btn btn-sm btn-outline-danger" type="button">متابعة</button>
                      </td>
                    </tr>
                  ))}
                  {recentReports.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">لا توجد بيانات بلاغات متاحة حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 mb-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">🔄 حالة المزامنة</h5>
            <div className="list-group list-group-flush">
              <div className="list-group-item bg-transparent border-secondary d-flex justify-content-between">
                <span className="text-light">العلامة الرئيسية</span>
                <span className="text-warning">{draft.platform.brandName}</span>
              </div>
              <div className="list-group-item bg-transparent border-secondary d-flex justify-content-between">
                <span className="text-light">الفئات النشطة</span>
                <span className="text-warning">{syncedSummary.totalCategories}</span>
              </div>
              <div className="list-group-item bg-transparent border-secondary d-flex justify-content-between">
                <span className="text-light">الروابط الخارجية</span>
                <span className="text-warning">{syncedSummary.totalLinks}</span>
              </div>
              <div className="list-group-item bg-transparent border-secondary d-flex justify-content-between">
                <span className="text-light">المصادر من الـ API</span>
                <span className="text-warning">{stats.totalSources}</span>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">⚡ إجراءات سريعة</h5>
            <div className="d-grid gap-2">
              <button className="btn btn-warning" type="button" onClick={saveSettings} disabled={isSaving}>
                <i className="bi bi-save me-2"></i>
                {isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
              </button>
              <button className="btn btn-outline-warning" type="button" onClick={addLink}>
                <i className="bi bi-link-45deg me-2"></i>
                إضافة رابط موثوق
              </button>
              <button className="btn btn-outline-info" type="button" onClick={resetEgyptianLinks}>
                <i className="bi bi-arrow-repeat me-2"></i>
                استرجاع الروابط الافتراضية
              </button>
              <button className="btn btn-outline-warning" type="button" onClick={addCategory}>
                <i className="bi bi-grid me-2"></i>
                إضافة فئة
              </button>
              <button className="btn btn-outline-danger" type="button" onClick={resetSettings}>
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                استعادة الافتراضيات
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-4 mt-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 text-warning">⚙️ إعدادات المحتوى المتزامنة</h5>
          <small className="text-muted">أي تعديل هنا ينعكس على العنوان الرئيسي، الفئات، وروابط المصادر.</small>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label text-light">اسم المنصة</label>
            <input className="form-control" value={draft.platform.brandName} onChange={(e) => updatePlatformField('brandName', e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label text-light">السطر التعريفي</label>
            <input className="form-control" value={draft.platform.heroKicker} onChange={(e) => updatePlatformField('heroKicker', e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label text-light">عنوان البانر الرئيسي</label>
            <input className="form-control" value={draft.platform.heroTitle} onChange={(e) => updatePlatformField('heroTitle', e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label text-light">وصف المنصة</label>
            <textarea className="form-control" rows="3" value={draft.platform.heroDescription} onChange={(e) => updatePlatformField('heroDescription', e.target.value)} />
          </div>
        </div>

        <h6 className="text-warning mb-3">الفئات المستخدمة في المقالات</h6>
        <div className="row g-3 mb-4">
          {draft.categories.map((category, index) => (
            <div key={`${category.id}-${index}`} className="col-12">
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label text-light">المعرف</label>
                  <input className="form-control" value={category.id} onChange={(e) => updateCategoryField(index, 'id', e.target.value)} disabled={category.id === 'all'} />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-light">الاسم</label>
                  <input className="form-control" value={category.name} onChange={(e) => updateCategoryField(index, 'name', e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-light">الأيقونة</label>
                  <input className="form-control" value={category.icon} onChange={(e) => updateCategoryField(index, 'icon', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-danger w-100" type="button" onClick={() => removeCategory(index)} disabled={category.id === 'all'}>
                    حذف الفئة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h6 className="text-warning mb-3">الروابط الخارجية الموثوقة</h6>
        <div className="row g-3">
          {draft.externalLinks.map((link, index) => (
            <div key={`${link.name || 'link'}-${index}`} className="col-12">
              <div className="card border-secondary bg-dark-subtle bg-opacity-10">
                <div className="card-body">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label text-light">اسم الرابط</label>
                      <input className="form-control" value={link.name} onChange={(e) => updateLinkField(index, 'name', e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-light">الرابط</label>
                      <input className="form-control" value={link.url} onChange={(e) => updateLinkField(index, 'url', e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label text-light">الأيقونة</label>
                      <input className="form-control" value={link.icon} onChange={(e) => updateLinkField(index, 'icon', e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label text-light">التصنيف</label>
                      <input className="form-control" value={link.category} onChange={(e) => updateLinkField(index, 'category', e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-light">الوصف</label>
                      <input className="form-control" value={link.description} onChange={(e) => updateLinkField(index, 'description', e.target.value)} />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-outline-danger" type="button" onClick={() => removeLink(index)}>
                        حذف الرابط
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
