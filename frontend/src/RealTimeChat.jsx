import { useState, useEffect, useRef } from 'react';

function RealTimeChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(342);
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'محمد أحمد',
    avatar: '👤',
    role: 'user'
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulate initial messages
    const initialMessages = [
      {
        id: 1,
        user: { name: 'نظام AI', avatar: '🤖', role: 'system' },
        message: 'مرحباً بك في غرفة الدردشة العامة! هنا يمكننا مناقشة الشائعات ومشاركة المعلومات.',
        timestamp: new Date(Date.now() - 300000),
        type: 'system'
      },
      {
        id: 2,
        user: { name: 'خالد محمد', avatar: '👨', role: 'reviewer' },
        message: 'تم التحقق من بلاغ جديد عن لقاح كورونا، النتيجة: معلومة مضللة',
        timestamp: new Date(Date.now() - 240000),
        type: 'user'
      },
      {
        id: 3,
        user: { name: 'فاطمة علي', avatar: '👩', role: 'user' },
        message: 'شكراً على التوضيح، هل يمكننا معرفة المصدر؟',
        timestamp: new Date(Date.now() - 180000),
        type: 'user'
      }
    ];
    setMessages(initialMessages);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const newMessage = {
      id: Date.now(),
      user: currentUser,
      message: input,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        'هذه معلومة مهمة، سأقوم بالتحقق منها فوراً.',
        'شكراً لمشاركتك، تم إضافة هذا إلى قائمة المراجعة.',
        'معلومات جيدة، هل يمكنك تزويدنا بالمزيد من التفاصيل؟',
        'تم تحليل المحتوى، النتائج ستكون متاحة قريباً.'
      ];
      
      const aiMessage = {
        id: Date.now() + 1,
        user: { name: 'مساعد AI', avatar: '🤖', role: 'system' },
        message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
        type: 'system'
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="real-time-chat">
      <div className="chat-header">
        <div className="chat-info">
          <h4 className="mb-0">
            💬 غرفة الدردشة العامة
            <span className="badge bg-success ms-2">{onlineUsers} متصل</span>
          </h4>
          <p className="text-muted mb-0">مناقشة الشائعات والتحقق من المعلومات</p>
        </div>
        <div className="chat-actions">
          <button className="btn btn-outline-warning btn-sm">
            🔔 إشعارات
          </button>
          <button className="btn btn-outline-warning btn-sm">
            ⚙️ إعدادات
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.type === 'system' ? 'message-system' : 'message-user'}`}
          >
            <div className="message-avatar">
              {message.user.avatar}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-author">
                  {message.user.name}
                  {message.user.role === 'reviewer' && (
                    <span className="badge bg-info ms-1">مراجع</span>
                  )}
                  {message.user.role === 'system' && (
                    <span className="badge bg-primary ms-1">نظام</span>
                  )}
                </span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-text">
                {message.message}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message message-system">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="input-group">
          <button 
            type="button" 
            className="btn btn-outline-warning"
            title="إرفاق ملف"
          >
            📎
          </button>
          <input
            ref={inputRef}
            type="text"
            className="form-control"
            placeholder="اكتب رسالتك..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            type="button" 
            className="btn btn-outline-warning"
            title="إيموجي"
          >
            😊
          </button>
          <button 
            type="submit" 
            className="btn btn-warning"
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? '...' : 'إرسال'}
          </button>
        </div>
      </form>

      <div className="chat-sidebar">
        <div className="sidebar-section">
          <h6>المستخدمون النشطون</h6>
          <div className="online-users">
            <div className="user-item">
              <span className="user-avatar">👨</span>
              <span className="user-name">خالد محمد</span>
              <span className="user-status online"></span>
            </div>
            <div className="user-item">
              <span className="user-avatar">👩</span>
              <span className="user-name">فاطمة علي</span>
              <span className="user-status online"></span>
            </div>
            <div className="user-item">
              <span className="user-avatar">👤</span>
              <span className="user-name">أحمد سالم</span>
              <span className="user-status online"></span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h6>التحقق السريع</h6>
          <div className="quick-actions">
            <button className="btn btn-outline-warning btn-sm w-100 mb-2">
              🔍 التحقق من رابط
            </button>
            <button className="btn btn-outline-warning btn-sm w-100 mb-2">
              📸 تحليل صورة
            </button>
            <button className="btn btn-outline-warning btn-sm w-100">
              📊 إحصائيات اليوم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTimeChat;
