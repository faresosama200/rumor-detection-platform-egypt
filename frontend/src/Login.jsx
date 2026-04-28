import { useState } from 'react';
import { useAuth } from './auth';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const { login }          = useAuth();
  const navigate           = useNavigate();
  const [email, setEmail]  = useState('');
  const [pass, setPass]    = useState('');
  const [err, setErr]      = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await login(email, pass);
      navigate('/report');
    } catch (ex) {
      setErr(ex.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">🛡️</div>
        <h2>تسجيل الدخول</h2>
        <p className="auth-subtitle">منصة مكافحة الشائعات</p>
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>كلمة المرور</label>
            <input className="form-control" type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn btn-warning w-100 mt-3" type="submit" disabled={loading}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>
        <p className="mt-3 text-center">
          ليس لديك حساب؟ <Link to="/register">سجّل الآن</Link>
        </p>
        <div className="demo-hint">
          <small>🔑 تجريبي: admin@platform.com / admin123</small>
        </div>
      </div>
    </div>
  );
}

export default Login;
