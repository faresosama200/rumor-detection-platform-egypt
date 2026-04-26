import { useState, useEffect, useRef } from 'react';
import { api, endpoints } from './api';

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const res = await api.post(endpoints.aiChat, {
        message: userMessage.content,
        history,
      });

      const aiResponse = {
        role: 'assistant',
        content: res.data?.reply || 'تعذر تكوين الرد الآن، حاول مرة أخرى.',
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: error?.response?.data?.error || 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm p-4">
      <h2 className="h4 mb-4">
        🤖 مساعد الذكاء الاصطناعي للتحقق
      </h2>
      
      <div className="chat-container" style={{ 
        height: '500px', 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid var(--gold)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div className="chat-messages flex-grow-1 p-3 overflow-auto" style={{ 
          background: '#1a1a1a',
          color: 'var(--text-light)'
        }}>
          {messages.length === 0 && (
            <div className="text-center text-muted py-5">
              <h5>مرحباً! أنا مساعدك الذكي العام</h5>
              <p>اسأل في أي موضوع: تقنية، تعليم، كتابة، تحليل، أو أي استفسار عام.</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message mb-3 ${
                message.role === 'user' ? 'text-end' : 'text-start'
              }`}
            >
              <div
                className={`message-content p-3 rounded-3 d-inline-block ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-dark text-light border border-warning'
                }`}
                style={{
                  maxWidth: '70%',
                  background: message.role === 'user' 
                    ? 'var(--gold)' 
                    : '#2a2a2a',
                  border: message.role === 'assistant' 
                    ? '1px solid var(--gold)' 
                    : 'none'
                }}
              >
                {message.content.split('\n').map((line, i) => (
                  <div key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </div>
                ))}
              </div>
              <div className="small text-muted mt-1">
                {message.role === 'user' ? 'أنت' : 'المساعد الذكي'}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-start mb-3">
              <div className="message-content p-3 rounded-3 d-inline-block bg-dark text-light border border-warning">
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span>جاري التفكير...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-3 border-top" style={{ 
          background: '#1a1a1a',
          borderTop: '1px solid var(--gold)'
        }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              disabled={isLoading}
              style={{
                background: '#2a2a2a',
                border: '1px solid var(--gold)',
                color: 'var(--text-light)'
              }}
            />
            <button
              type="submit"
              className="btn"
              disabled={isLoading || !input.trim()}
              style={{
                background: 'var(--gold)',
                border: '1px solid var(--gold)',
                color: '#000'
              }}
            >
              إرسال
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-3">
        <h6>قدرات المساعد:</h6>
        <div className="row g-2">
          <div className="col-md-6">
            <div className="badge bg-dark text-warning p-2 mb-2 w-100">
              💻 دعم تقني وبرمجي
            </div>
          </div>
          <div className="col-md-6">
            <div className="badge bg-dark text-warning p-2 mb-2 w-100">
              ✍️ كتابة وصياغة محتوى
            </div>
          </div>
          <div className="col-md-6">
            <div className="badge bg-dark text-warning p-2 mb-2 w-100">
              📚 شرح وتبسيط المعلومات
            </div>
          </div>
          <div className="col-md-6">
            <div className="badge bg-dark text-warning p-2 mb-2 w-100">
              🧭 أسئلة عامة في أي إطار
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
