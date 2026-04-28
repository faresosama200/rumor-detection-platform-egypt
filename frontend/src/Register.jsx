import { useState } from 'react';
import { useAuth } from './auth';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const { register }       = useAuth();
  const navigate           = useNavigate();
  const [name, setName]    = useState('');
  const [email, setEmail]  = useState('');
  const [pass, setPass]    = useState('');
  const [err, setErr]      = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await register(name, email, pass);
      navigate('/login');
    } catch (ex) {
      setErr(ex.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">🛡️</div>
        <h2>إنشاء حساب</h2>
        <p className="auth-subtitle">منصة مكافحة الشائعات</p>
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="أحمد محمد" />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>البريد الإلكتروني</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>كلمة المرور</label>
            <input className="form-control" type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••" minLength={6} />
          </div>
          <button className="btn btn-warning w-100 mt-3" type="submit" disabled={loading}>
            {loading ? 'جارٍ التسجيل...' : 'إنشاء حساب'}
          </button>
        </form>
        <p className="mt-3 text-center">
          لديك حساب بالفعل؟ <Link to="/login">سجّل دخولك</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
