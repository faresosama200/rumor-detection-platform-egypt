import { useState } from 'react';
import { useAuth } from './auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [err, setErr]         = useState('');
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📝</div>
        <h2 className="auth-title">إنشاء حساب جديد</h2>
        <p className="auth-sub">انضم لمنصة مكافحة الشائعات</p>
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="field-group">
            <label>الاسم الكامل</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="محمد أحمد" />
          </div>
          <div className="field-group">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" />
          </div>
          <div className="field-group">
            <label>كلمة المرور</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••" minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '✅ إنشاء الحساب'}
          </button>
        </form>
        <p className="auth-footer">لديك حساب؟ <Link to="/login">سجّل دخولك</Link></p>
      </div>
    </div>
  );
}
