import { useState } from 'react';
import { useAuth } from './auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await login(email, pass);
      navigate('/home');
    } catch (ex) {
      if (!ex.response) setErr('الخادم غير متاح حالياً. برجاء المحاولة لاحقاً.');
      else setErr(ex.response?.data?.message || 'بيانات غير صحيحة');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛡️</div>
        <h2 className="auth-title">تسجيل الدخول</h2>
        <p className="auth-sub">منصة مكافحة الشائعات — حروب الجيل الرابع</p>
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="field-group">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" autoComplete="email" />
          </div>
          <div className="field-group">
            <label>كلمة المرور</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '🔐 دخول'}
          </button>
        </form>
        <p className="auth-footer">ليس لديك حساب؟ <Link to="/register">سجّل الآن</Link></p>
        <div className="auth-demo">🔑 تجريبي: admin@platform.com / admin123</div>
      </div>
    </div>
  );
}
