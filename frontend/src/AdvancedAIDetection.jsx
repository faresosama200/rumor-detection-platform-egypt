import { useEffect, useState } from 'react';
import AppIcon from './AppIcon';
import api from './api';

function AdvancedAIDetection() {
  const [text, setText]       = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [aiConfigured, setAiConfigured] = useState(null);

  useEffect(() => {
    api.get('/api/ai-status')
      .then((r) => setAiConfigured(!!r.data?.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  const analyze = async e => {
    e.preventDefault();
    if (!text.trim() && !mediaFile && !videoUrl.trim()) return;
    setLoading(true); setResult(null); setErr('');
    try {
      const payload = { text };

      if (videoUrl.trim()) {
        payload.mediaType = 'video-url';
        payload.mediaUrl = videoUrl.trim();
      }

      if (mediaFile) {
        const reader = new FileReader();
        const b64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
          reader.onerror = () => reject(new Error('فشل قراءة الملف'));
          reader.readAsDataURL(mediaFile);
        });
        payload.mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        payload.mediaMime = mediaFile.type;
        payload.mediaBase64 = b64;
      }

      const r = await api.post('/api/verify-ai', payload);
      setResult(r.data);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'خطأ في التحليل');
    } finally { setLoading(false); }
  };

  const color = result
    ? result.confidence >= 60 ? '#e53935' : result.confidence >= 30 ? '#f57c00' : '#43a047'
    : '#888';

  return (
    <div className="page-wrap">
      <div className="page-hero">
        <div className="page-hero-icon"><AppIcon name="brain" size={48} /></div>
        <h1>التحقق الآلي بالذكاء الاصطناعي</h1>
        <p>أدخل نص الخبر أو الشائعة وسيقوم الذكاء الاصطناعي بتحليله فوراً</p>
      </div>

      {aiConfigured === false && (
        <div className="inline-msg error" style={{ marginBottom: 16 }}>
          <AppIcon name="report" size={14} /> الذكاء الاصطناعي غير مربوط حالياً. التحقق المتقدم لن يعمل.
        </div>
      )}

      <form onSubmit={analyze} className="card-form">
        <div className="field-group">
          <label>نص الخبر أو الشائعة <span style={{color:'var(--c-muted)',fontSize:12}}>(اختياري إذا أضفت صورة/فيديو)</span></label>
          <textarea className="field" rows={5} value={text} onChange={e => setText(e.target.value)}
            placeholder="الصق هنا نص الخبر أو الشائعة التي تريد التحقق منها..." />
        </div>
        <div className="field-group" style={{marginTop:16}}>
          <label>صورة أو فيديو للتحقق</label>
          <input
            className="field"
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={e => {
              const f = e.target.files?.[0] || null;
              setMediaFile(f);
              setVideoUrl('');
              if (!f) return setMediaPreview('');
              if (f.type.startsWith('image/')) {
                const rd = new FileReader();
                rd.onload = () => setMediaPreview(String(rd.result || ''));
                rd.readAsDataURL(f);
              } else {
                setMediaPreview('');
              }
            }}
          />
          {mediaPreview && (
            <img src={mediaPreview} alt="preview" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', marginTop: 10, borderRadius: 10 }} />
          )}
        </div>
        <div className="field-group" style={{marginTop:16}}>
          <label>أو ضع رابط فيديو للتحقق</label>
          <input
            className="field"
            type="url"
            value={videoUrl}
            onChange={e => { setVideoUrl(e.target.value); if (e.target.value) setMediaFile(null); }}
            placeholder="https://..."
          />
        </div>
        <button className="btn-primary" style={{marginTop:20,width:'100%'}} type="submit" disabled={loading || (!text.trim() && !mediaFile && !videoUrl.trim())}>
          {loading
            ? <><AppIcon name="brain" size={16} /> جارٍ التحليل...</>
            : <><AppIcon name="verify" size={16} /> تحليل الآن</>}
        </button>
      </form>

      {err && <div className="inline-msg error" style={{marginTop:12}}>{err}</div>}

      {result && (
        <div className="result-card">
          <div className="result-meter" style={{ '--color': color }}>
            <div className="result-circle" style={{ borderColor: color }}>
              <span style={{ color, fontSize: '2rem', fontWeight: 700 }}>{result.confidence}%</span>
              <span style={{ fontSize: 12, color: '#888' }}>صحة المعلومة</span>
            </div>
          </div>
          <div className="result-verdict" style={{ color }}>
            {result.verdict === 'شائعة' || result.verdict === 'شائعة محتملة'
              ? <AppIcon name="rumor" size={20} />
              : result.verdict === 'مشبوه'
              ? <AppIcon name="report" size={20} />
              : <AppIcon name="trusted" size={20} />}
            {' '}{result.verdict}
          </div>
          <div className="result-summary">{result.summary}</div>
          {result.reasons?.length > 0 && (
            <ul className="result-reasons">
              {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          <div className="result-source">
            <AppIcon name="spark" size={12} />
            {' '}{result.source === 'gemini' ? 'مدعوم بـ Google Gemini AI' : 'نتيجة التحقق'}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedAIDetection;
