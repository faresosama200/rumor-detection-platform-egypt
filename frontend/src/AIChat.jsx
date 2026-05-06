import { useState, useRef, useEffect } from 'react';
import AppIcon from './AppIcon';
import api from './api';

function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'مرحباً! أنا مساعدك الذكي لمكافحة الشائعات. كيف يمكنني مساعدتك؟' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(null);
  const [err, setErr]         = useState('');
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    api.get('/api/ai-status')
      .then((r) => setAiConfigured(!!r.data?.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  const send = async e => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setErr('');
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await api.post('/api/ai-chat', { message: msg });
      setMessages(m => [...m, { role: 'assistant', text: r.data.reply }]);
    } catch (ex) {
      const serverMsg = ex.response?.data?.message || 'عذراً، حدث خطأ في الاتصال';
      setErr(serverMsg);
      setMessages(m => [...m, { role: 'assistant', text: 'تعذر تنفيذ الطلب الآن. راجع رسالة الخطأ ثم حاول مجدداً.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrap">
      <div className="page-hero">
        <div className="page-hero-icon"><AppIcon name="brain" size={48} /></div>
        <h1>دردشة مع الذكاء الاصطناعي</h1>
        <p>اسألني عن أي خبر أو شائعة وسأساعدك في التحقق منها</p>
      </div>

      {aiConfigured === false && (
        <div className="inline-msg error" style={{ marginBottom: 16 }}>
          <AppIcon name="report" size={14} /> الذكاء الاصطناعي غير مفعّل حالياً على الخادم.
        </div>
      )}
      {aiConfigured === true && (
        <div className="inline-msg success" style={{ marginBottom: 16 }}>
          <AppIcon name="trusted" size={14} /> شات الذكاء الاصطناعي متصل وجاهز.
        </div>
      )}
      {err && <div className="inline-msg error" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg--${m.role}`}>
            {m.role === 'assistant' && (
              <div className="chat-avatar"><AppIcon name="brain" size={16} /></div>
            )}
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-avatar"><AppIcon name="brain" size={16} /></div>
            <div className="chat-bubble typing-indicator"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input-row">
        <input
          className="field"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          disabled={loading}
        />
        <button className="btn-primary" type="submit" disabled={loading || !input.trim()}>
          <AppIcon name="spark" size={16} /> إرسال
        </button>
      </form>
    </div>
  );
}

export default AIChat;
