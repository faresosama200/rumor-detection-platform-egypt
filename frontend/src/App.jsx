import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { api, endpoints } from './api';
import { AuthProvider, useAuth } from './auth.jsx';
import LoginPage from './Login';
import RegisterPage from './Register';
import AIChat from './AIChat';
import AdminDashboard from './AdminDashboard';
import NotificationsProvider, { useNotifications } from './Notifications';
import LoadingSpinner from './LoadingSpinner';
import AdvancedAnalytics from './AdvancedAnalytics';
import FileUploadProgress from './FileUploadProgress';
import RealTimeChat from './RealTimeChat';
import AdvancedAIDetection from './AdvancedAIDetection';
import ReportReviewSystem from './ReportReviewSystem';
import ExternalLinksPage from './ExternalLinksPage';
import VideoAwareness from './VideoAwareness';
import AdminArticles from './AdminArticles';
import { getDefaultArticles, useContentSettings } from './contentSettings';

function App() {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationsProvider>
  );
}

function AppContent() {
  const { user, logout, isAuthenticated, isAdmin, isReviewer } = useAuth();
  const { success, error, warning, info } = useNotifications();
  const { settings } = useContentSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell fade-in">
      <header className="topbar">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link className="brand" to="/">
            {settings.platform.brandName}
          </Link>
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="قائمة">
            {menuOpen ? "✕" : "☰"}
          </button>
          <nav className={"d-flex gap-3 nav-links" + (menuOpen ? " mobile-open" : "")} onClick={() => setMenuOpen(false)}>
            {isAuthenticated && <NavLink to="/" end>🏠 الرئيسية</NavLink>}
            {isAuthenticated && <NavLink to="/report">📤 رفع بلاغ</NavLink>}
            {isAuthenticated && <NavLink to="/my-reports">🧾 بلاغاتي</NavLink>}
            {(isReviewer || isAdmin || user?.role === 'spokesperson') && <NavLink to="/review">🛡️ فريق التحقق</NavLink>}
            {isAuthenticated && <NavLink to="/articles">📚 المقالات</NavLink>}
            {isAuthenticated && <NavLink to="/external-links">🔗 روابط موثوقة</NavLink>}
            {isAuthenticated && <NavLink to="/search">🔎 البحث</NavLink>}
            {isAuthenticated && <NavLink to="/ai-chat">🤖 التحقق الذكي</NavLink>}
            {isAuthenticated && <NavLink to="/realtime-chat">💬 الدردشة المباشرة</NavLink>}
            {isAuthenticated && <NavLink to="/ai-detection">🧠 الكشف المتقدم</NavLink>}
            {isAdmin && <NavLink to="/analytics">📈 التحليلات المتقدمة</NavLink>}
            {isAuthenticated && <NavLink to="/videos">🎬 فيديوهات توعوية</NavLink>}
            {isAdmin && <NavLink to="/admin-articles">📝 إدارة المقالات</NavLink>}
            {isAdmin && <NavLink to="/admin">⚙️ لوحة المدير</NavLink>}
          </nav>
          <div className="d-flex gap-2 align-items-center">
            {isAuthenticated ? (
              <>
                <span className="text-warning">{user?.name}</span>
                {isAdmin && <span className="badge bg-danger">مدير</span>}
                <button className="btn btn-sm btn-outline-danger" onClick={logout}>
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm btn-outline-warning" to="/login">
                  دخول
                </Link>
                <Link className="btn btn-sm btn-warning" to="/register">
                  تسجيل
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container py-4 py-lg-5">
        <Routes>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
          <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute>{isReviewer || isAdmin || user?.role === 'spokesperson' ? <ReportReviewSystem /> : <Navigate to="/" />}</ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
          <Route path="/external-links" element={<ProtectedRoute><ExternalLinksPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
          <Route path="/realtime-chat" element={<ProtectedRoute><RealTimeChat /></ProtectedRoute>} />
          <Route path="/ai-detection" element={<ProtectedRoute><AdvancedAIDetection /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute>{isAdmin ? <AdvancedAnalytics /> : <Navigate to="/" />}</ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute>{isAdmin ? <AdminDashboard /> : <Navigate to="/" />}</ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useContentSettings();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    trueReports: 0,
    falseReports: 0,
    totalArticles: 0,
    totalSources: 0,
    categoryStats: [],
    topTags: [],
  });

  useEffect(() => {
    api.get(endpoints.dashboard).then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero p-4 p-lg-5 mb-4">
        <p className="kicker mb-2">{settings.platform.heroKicker}</p>
        <h1 className="display-6 fw-bold mb-3">
          {settings.platform.heroTitle}
        </h1>
        <p className="mb-0 text-light-emphasis">
          {settings.platform.heroDescription}
          {!isAuthenticated && ' سجل دخولك للوصول الكامل للمنصة.'}
        </p>
        {!isAuthenticated && (
          <div className="mt-3">
            <Link className="btn btn-warning btn-lg me-2" to="/login">
              تسجيل دخول
            </Link>
            <Link className="btn btn-outline-warning btn-lg" to="/register">
              إنشاء حساب
            </Link>
          </div>
        )}
      </section>

      <section className="row g-3 mb-4 tool-grid">
        <div className="col-lg-4">
          <div className="tool-card">
            <div className="tool-icon">AI</div>
            <h3>التحقق الآلي</h3>
            <p>استخدم فحصا أوليا للخبر قبل تحويله لفريق المراجعة البشرية.</p>
            <Link className="btn btn-warning btn-sm" to="/ai-chat">جرب الآن</Link>
          </div>
        </div>
        {isAuthenticated && (
          <>
            <div className="col-lg-4">
              <div className="tool-card">
                <div className="tool-icon">#</div>
                <h3>أدوات التحقق</h3>
                <p>مراجعة البلاغات تأكيد True/False وإسناد النتيجة لمصدر موثوق.</p>
                <Link className="btn btn-warning btn-sm" to="/review">استعراض الأدوات</Link>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="tool-card">
                <div className="tool-icon">DB</div>
                <h3>الأرشيف</h3>
                <p>قاعدة بيانات للبلاغات السابقة والوسوم الأكثر انتشارا.</p>
                <Link className="btn btn-warning btn-sm" to="/search">استعراض الأرشيف</Link>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="row g-3 g-lg-4 mb-4">
        <Metric title="إجمالي البلاغات" value={stats.totalReports} tone="primary" />
        <Metric title="قيد المراجعة" value={stats.pendingReports} tone="warning" />
        <Metric title="نتيجة True" value={stats.trueReports} tone="success" />
        <Metric title="نتيجة False" value={stats.falseReports} tone="danger" />
        <Metric title="مصادر موثقة" value={stats.totalSources} tone="info" />
        <Metric title="مقالات توعوية" value={stats.totalArticles} tone="dark" />
      </section>

      <section className="card border-0 shadow-sm p-4 mb-4 stats-visual-wrap">
        <h2 className="stats-heading">إحصائيات الشائعات</h2>
        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="chart-card">
              <h3 className="h6 mb-3">حالة البلاغات</h3>
              <DonutChart
                total={stats.totalReports}
                segments={[
                  { label: 'معلقة', value: stats.pendingReports, color: '#f59e0b' },
                  { label: 'تم التحقق', value: stats.trueReports, color: '#10b981' },
                  { label: 'خاطئة', value: stats.falseReports, color: '#ef4444' },
                ]}
              />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="chart-card">
              <h3 className="h6 mb-3">أكثر التصنيفات انتشارا</h3>
              <BarChart items={stats.categoryStats || []} />
            </div>
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm p-4 mb-4">
        <h2 className="h5 mb-3">الوسوم الأكثر تداولا</h2>
        <div className="d-flex flex-wrap gap-2">
          {stats.topTags?.length ? (
            stats.topTags.map((item) => (
              <span key={item.tag} className="badge rounded-pill text-bg-light px-3 py-2">
                #{item.tag} ({item.count})
              </span>
            ))
          ) : (
            <p className="text-muted mb-0">لا توجد وسوم بعد.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ title, value, tone }) {
  return (
    <div className="col-6 col-lg-4">
      <div className={`metric metric-${tone}`}>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value ?? 0}</div>
      </div>
    </div>
  );
}

function DonutChart({ total, segments }) {
  const normalizedTotal = Math.max(1, Number(total || 0));
  const gradient = useMemo(() => {
    let current = 0;
    const parts = segments
      .filter((s) => Number(s.value) > 0)
      .map((segment) => {
        const start = (current / normalizedTotal) * 100;
        current += Number(segment.value);
        const end = (current / normalizedTotal) * 100;
        return `${segment.color} ${start}% ${end}%`;
      });

    return parts.length ? `conic-gradient(${parts.join(', ')})` : 'conic-gradient(#e5e7eb 0 100%)';
  }, [segments, normalizedTotal]);

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: gradient }}>
        <div className="donut-inner">{total || 0}</div>
      </div>
      <div className="donut-legend">
        {segments.map((s) => (
          <div className="donut-legend-item" key={s.label}>
            <span className="dot" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ items }) {
  const max = Math.max(1, ...(items || []).map((x) => Number(x.count || 0)));

  if (!items?.length) {
    return <p className="text-muted mb-0">لا توجد بيانات كافية لعرض الرسم.</p>;
  }

  return (
    <div className="bars-wrap">
      {items.map((item, idx) => {
        const pct = Math.max(8, Math.round((Number(item.count || 0) / max) * 100));
        return (
          <div className="bar-row" key={`${item.category}-${idx}`}>
            <span className="bar-label">{item.category || 'عام'}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bar-value">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReportPage() {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    sourceUrl: '',
    tags: '',
  });
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setResult('');

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append('userId', user?.id || '');
      files.forEach((file) => data.append('evidence', file));

      const res = await api.post(endpoints.reports, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(`تم إرسال البلاغ رقم ${res.data.reportId} وعدد المرفقات: ${res.data.evidenceCount}`);
      setForm({ title: '', description: '', category: 'general', sourceUrl: '', tags: '' });
      setFiles([]);
    } catch (err) {
      setResult(err?.response?.data?.error || 'فشل إرسال البلاغ.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card border-0 shadow-sm p-4 text-center">
        <h3 className="h4 mb-3">يجب تسجيل الدخول لرفع بلاغ</h3>
        <p className="mb-4">قم بتسجيل الدخول أو إنشاء حساب جديد لتتمكن من رفع بلاغات الشائعات</p>
        <div className="d-flex gap-2 justify-content-center">
          <Link className="btn btn-warning" to="/login">تسجيل دخول</Link>
          <Link className="btn btn-outline-warning" to="/register">إنشاء حساب</Link>
        </div>
      </div>
    );
  }

  return (
    <section className="card border-0 shadow-sm p-4">
      <h2 className="h4 mb-3">رفع بلاغ شائعة + الأدلة</h2>
      <form onSubmit={onSubmit} className="row g-3">
        <div className="col-12">
          <label className="form-label">العنوان</label>
          <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="col-12">
          <label className="form-label">الوصف</label>
          <textarea className="form-control" rows="4" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="col-md-4">
          <label className="form-label">التصنيف</label>
          <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">عام</option>
            <option value="health">صحي</option>
            <option value="politics">سياسي</option>
            <option value="economy">اقتصادي</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">رابط المصدر</label>
          <input className="form-control" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div className="col-md-4">
          <label className="form-label">وسوم (مفصولة بفاصلة)</label>
          <input className="form-control" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="صحة,لقاح" />
        </div>
        <div className="col-12">
          <label className="form-label">رفع أدلة (صور/PDF/فيديو)</label>
          <FileUploadProgress />
        </div>
        <div className="col-12 d-flex gap-2 align-items-center">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'جاري الإرسال...' : 'إرسال البلاغ'}</button>
          {result && <span className="text-muted">{result}</span>}
        </div>
      </form>
    </section>
  );
}

function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api
      .get(`${endpoints.reports}?userId=${encodeURIComponent(user.id)}&limit=100`)
      .then((res) => setReports(res.data?.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));
  }, [user?.id]);

  return (
    <section className="card border-0 shadow-sm p-4">
      <h2 className="h4 mb-3">🧾 البلاغات المقدمة</h2>
      <p className="text-muted">هذه قائمة البلاغات التي قمت بتقديمها بحسابك.</p>
      {loadingReports ? (
        <p className="text-warning mb-0">جاري تحميل البلاغات...</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التصنيف</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item) => (
                <tr key={item.report_id}>
                  <td>{item.title}</td>
                  <td>{item.category || 'عام'}</td>
                  <td><span className={`badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                </tr>
              ))}
              {!reports.length && (
                <tr>
                  <td colSpan="4" className="text-center text-muted">لا توجد بلاغات مقدمة بهذا الحساب حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReviewPage() {
  const [reports, setReports] = useState([]);
  const [sources, setSources] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    Promise.all([api.get(endpoints.reviewReports), api.get(endpoints.sources)])
      .then(([r, s]) => {
        setReports(r.data.reports || []);
        setSources(s.data.sources || []);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const verify = async (id, verdict) => {
    setBusyId(id);
    try {
      await api.put(`/reports/${id}/verification`, {
        verdict,
        reason: verdict === 'false' ? 'نتيجة التحقق: الخبر غير صحيح.' : 'نتيجة التحقق: الخبر صحيح.',
        sourceId: sources[0]?.source_id || null,
      });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card border-0 shadow-sm p-4">
      <h2 className="h4 mb-3">Workflow فحص ومراجعة البلاغات</h2>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>التصنيف</th>
              <th>الحالة</th>
              <th>إجراء الفريق</th>
              <th>مشاركة</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((item) => (
              <tr key={item.report_id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>
                  <span className={`badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                </td>
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-success" disabled={busyId === item.report_id} onClick={() => verify(item.report_id, 'true')}>True</button>
                  <button className="btn btn-sm btn-danger" disabled={busyId === item.report_id} onClick={() => verify(item.report_id, 'false')}>False</button>
                </td>
                <td>
                  <ShareButtons text={`نتيجة فحص البلاغ: ${item.title} => ${item.status}`} />
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan="5" className="text-center text-muted">لا توجد بلاغات حاليا.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusClass(status) {
  if (status === 'true') return 'text-bg-success';
  if (status === 'false') return 'text-bg-danger';
  return 'text-bg-warning';
}

function statusLabel(status) {
  if (status === 'true') return 'صحيح';
  if (status === 'false') return 'مضلل';
  return 'قيد المراجعة';
}

function ShareButtons({ text }) {
  const encoded = encodeURIComponent(text);
  const links = useMemo(
    () => ({
      x: `https://x.com/intent/tweet?text=${encoded}`,
      whatsapp: `https://wa.me/?text=${encoded}`,
    }),
    [encoded]
  );

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (_) {}
    }
  };

  return (
    <div className="d-flex gap-2">
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={shareNative}>مشاركة</button>
      <a className="btn btn-sm btn-outline-dark" href={links.x} target="_blank" rel="noreferrer">X</a>
      <a className="btn btn-sm btn-outline-success" href={links.whatsapp} target="_blank" rel="noreferrer">WA</a>
    </div>
  );
}

function ArticlesPage() {
  const { settings } = useContentSettings();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [remoteArticles, setRemoteArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const categories = settings.categories;
  const externalLinks = settings.externalLinks;
  const defaultArticles = getDefaultArticles();

  useEffect(() => {
    let mounted = true;
    api
      .get(`${endpoints.articles}?limit=1000`)
      .then((res) => {
        if (!mounted) return;
        setLoadFailed(false);
        const mapped = (res.data?.articles || []).map((a) => ({
          id: `db-${a.article_id}`,
          category: a.category === 'awareness' ? 'توعية' : (a.category || 'عام'),
          title: a.title,
          excerpt: String(a.content || '').slice(0, 140),
          content: a.content || '',
          author: 'فريق المنصة',
          date: a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : 'غير محدد',
          image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800',
          tags: String(a.tags || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          verified: true,
          source: 'قاعدة بيانات المنصة',
        }));
        setRemoteArticles(mapped);
      })
      .catch(() => {
        if (mounted) {
          setRemoteArticles([]);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (mounted) setLoadingArticles(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mergedArticles = useMemo(
    () => (loadFailed ? defaultArticles : [...remoteArticles, ...defaultArticles]),
    [defaultArticles, loadFailed, remoteArticles]
  );

  const filteredArticles = selectedCategory === 'all' 
    ? mergedArticles 
    : mergedArticles.filter(article => article.category === selectedCategory);

  return (
    <div className="articles-page">
      {!selectedArticle ? (
        <>
          <div className="mb-4">
            <h2 className="h3 mb-3">📚 المقالات التوعوية</h2>
            <p className="text-muted">مقالات موثقة ومصنفة في مجالات مختلفة</p>
            {loadingArticles && <p className="text-warning mb-1">جاري تحميل المقالات...</p>}
            {!loadFailed && (
              <p className="text-info mb-1">عدد المقالات المنشورة (متزامن مع الداشبورد): {remoteArticles.length}</p>
            )}
            {!loadFailed && (
              <p className="text-muted mb-0">المكتبة الإضافية: {defaultArticles.length} مقالة مع مصادرها التوعوية.</p>
            )}
            {loadFailed && <p className="text-info">عدد المقالات: {filteredArticles.length}</p>}
          </div>

          <div className="category-filter mb-4">
            <div className="d-flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`btn ${selectedCategory === category.id ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="alert alert-warning text-center">
              <h4>لا توجد مقالات في هذه الفئة حالياً</h4>
              <p>يرجى اختيار فئة أخرى أو العودة لاحقاً</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredArticles.map(article => (
                <div key={article.id} className="col-md-6 col-lg-4">
                  <div className="card article-card h-100" onClick={() => setSelectedArticle(article)}>
                    <div className="article-image">
                      <img src={article.image} alt={article.title} className="card-img-top" />
                      <div className="article-category">
                        <span className="badge bg-warning text-dark">
                          {categories.find(cat => cat.id === article.category)?.icon} {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{article.title}</h5>
                      <p className="card-text text-muted">{article.excerpt}</p>
                      <div className="article-meta">
                        <small className="text-muted">
                          <span>👤 {article.author}</span>
                          <span className="mx-2">|</span>
                          <span>📅 {article.date}</span>
                        </small>
                      </div>
                      <div className="article-tags mt-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                        ))}
                      </div>
                      {article.verified && (
                        <div className="verified-badge mt-2">
                          <span className="badge bg-success">✓ موثق</span>
                          <small className="text-muted ms-2">{article.source}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="external-links-section mt-5">
            <h3 className="h4 mb-3">🔗 روابط خارجية موثوقة</h3>
            <div className="row g-3">
              {externalLinks.map(link => (
                <div key={link.name} className="col-md-6 col-lg-3">
                  <a href={link.url} target="_blank" rel="noreferrer" className="external-link-card">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <div className="external-link-icon mb-2">{link.icon}</div>
                        <h6 className="card-title mb-1">{link.name}</h6>
                        <p className="card-text small text-muted">{link.description}</p>
                        <span className="badge bg-secondary">{link.category}</span>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="article-detail">
          <button className="btn btn-outline-warning mb-3" onClick={() => setSelectedArticle(null)}>
            ← العودة للمقالات
          </button>
          
          <div className="card border-0 shadow-sm">
            <div className="article-header">
              <img src={selectedArticle.image} alt={selectedArticle.title} className="article-hero-image" />
              <div className="article-header-content">
                <span className="badge bg-warning text-dark mb-2">
                  {categories.find(cat => cat.id === selectedArticle.category)?.icon} {selectedArticle.category}
                </span>
                <h1 className="article-title">{selectedArticle.title}</h1>
                <div className="article-meta">
                  <span>👤 {selectedArticle.author}</span>
                  <span className="mx-2">|</span>
                  <span>📅 {selectedArticle.date}</span>
                  {selectedArticle.verified && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="text-success">✓ موثق من {selectedArticle.source}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="card-body">
              <div className="article-content">
                {selectedArticle.content.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return <h3 key={index} className="article-subtitle">{paragraph.replace('## ', '')}</h3>;
                  } else if (paragraph.startsWith('# ')) {
                    return <h2 key={index} className="article-section-title">{paragraph.replace('# ', '')}</h2>;
                  } else if (paragraph.trim().startsWith('- ')) {
                    return <li key={index} className="article-list-item">{paragraph.replace('- ', '')}</li>;
                  } else if (paragraph.trim().startsWith('1.') || paragraph.trim().startsWith('2.') || paragraph.trim().startsWith('3.') || paragraph.trim().startsWith('4.')) {
                    return <li key={index} className="article-list-item">{paragraph}</li>;
                  } else if (paragraph.trim()) {
                    return <p key={index} className="article-paragraph">{paragraph}</p>;
                  }
                  return null;
                })}
              </div>
              
              <div className="article-tags-section mt-4">
                <h6>الوسوم:</h6>
                {selectedArticle.tags.map(tag => (
                  <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                ))}
              </div>
              
              <div className="article-actions mt-4">
                <ShareButtons text={selectedArticle.title} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  const search = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const res = await api.get(`${endpoints.search}?q=${encodeURIComponent(q)}`);
    setResults(res.data.results || []);
  };

  return (
    <section className="card border-0 shadow-sm p-4">
      <h2 className="h4 mb-3">Search + Tags</h2>
      <form className="d-flex gap-2 mb-3" onSubmit={search}>
        <input className="form-control" placeholder="ابحث في البلاغات والمقالات" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary">بحث</button>
      </form>
      <div className="d-flex flex-column gap-2">
        {results.map((r) => (
          <div key={`${r.type}-${r.id}`} className="search-row p-3 rounded-3 border">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <strong>{r.title}</strong>
              <span className="badge text-bg-light">{r.type}</span>
            </div>
            <p className="small text-muted mb-0">{String(r.body || '').slice(0, 180)}...</p>
          </div>
        ))}
        {!results.length && <p className="text-muted mb-0">لا توجد نتائج بعد.</p>}
      </div>
    </section>
  );
}

export default App;
