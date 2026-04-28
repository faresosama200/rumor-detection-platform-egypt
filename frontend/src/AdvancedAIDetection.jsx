import { useState } from 'react';
import api from './api';

function AdvancedAIDetection() {
  const [text, setText]       = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const analyze = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setResult(null); setErr('');
    try {
      const r = await api.post('/api/verify-ai', { text });
      setResult(r.data);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'خطأ في التحليل');
    } finally { setLoading(false); }
  };

  const color = result
    ? result.confidence >= 60 ? '#e53935' : result.confidence >= 30 ? '#f57c00' : '#43a047'
    : '#888';

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🔍 التحقق الآلي بالذكاء الاصطناعي</h2>
        <p>أدخل نص الخبر أو الشائعة وسيقوم الذكاء الاصطناعي بتحليله فوراً</p>
      </div>

      <form onSubmit={analyze} className="card-form mb-4">
        <div className="form-group">
          <label>نص الخبر أو الشائعة *</label>
          <textarea className="form-control" rows={5} value={text} onChange={e => setText(e.target.value)} required
            placeholder="الصق هنا نص الخبر أو الشائعة التي تريد التحقق منها..." />
        </div>
        <button className="btn btn-warning w-100 mt-3" type="submit" disabled={loading || !text.trim()}>
          {loading ? '🔄 جارٍ التحليل...' : '🔍 تحليل الآن'}
        </button>
      </form>

      {err && <div className="alert alert-danger">{err}</div>}

      {result && (
        <div className="result-card">
          <div className="result-meter" style={{ '--color': color }}>
            <div className="result-circle" style={{ borderColor: color }}>
              <span style={{ color, fontSize: '2rem', fontWeight: 700 }}>{result.confidence}%</span>
              <span style={{ fontSize: 12, color: '#888' }}>صحة المعلومة</span>
            </div>
          </div>
          <div className="result-verdict" style={{ color }}>
            {result.verdict === 'شائعة' || result.verdict === 'شائعة محتملة' ? '⚠️' : result.verdict === 'مشبوه' ? '🟡' : '✅'}
            {' '}{result.verdict}
          </div>
          <div className="result-summary">{result.summary}</div>
          {result.reasons?.length > 0 && (
            <ul className="result-reasons">
              {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          {result.source === 'gemini' && <div className="result-source">⚡ مدعوم بـ Google Gemini AI</div>}
        </div>
      )}
    </div>
  );
}

export default AdvancedAIDetection;
