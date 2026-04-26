import { useState } from 'react';
import { useAuth } from './auth.jsx';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm p-4">
          <h2 className="h4 mb-4 text-center">تسجيل الدخول</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">كلمة المرور</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </button>
          </form>
          <div className="text-center mt-3">
            <a href="/register" className="text-decoration-none">
              ليس لديك حساب؟ سجل الآن
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
