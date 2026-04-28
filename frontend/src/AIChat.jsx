import { useState, useRef, useEffect } from 'react';
import api from './api';

function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'مرحباً! أنا مساعدك الذكي لمكافحة الشائعات. كيف يمكنني مساعدتك؟' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async e => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await api.post('/api/ai-chat', { message: msg });
      setMessages(m => [...m, { role: 'assistant', text: r.data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🤖 دردشة مع الذكاء الاصطناعي</h2>
        <p>اسألني عن أي خبر أو شائعة وسأساعدك في التحقق منها</p>
      </div>
      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg--${m.role}`}>
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-bubble typing-indicator"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input-row">
        <input
          className="form-control"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          disabled={loading}
        />
        <button className="btn btn-warning" type="submit" disabled={loading || !input.trim()}>إرسال</button>
      </form>
    </div>
  );
}

export default AIChat;
