import React, { useState, useEffect } from 'react';
import { API_BASE } from './api';

export default function MinistriesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/ministries`)
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-wrap">
      <div className="center-loader"><span className="spin" /> جاري التحميل...</div>
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-hero">
        <h1>🏛️ وزارات جمهورية مصر العربية</h1>
        <p>الجهات الحكومية الرسمية — مصادرك الموثوقة للمعلومات الصحيحة</p>
      </div>
      <div className="min-grid">
        {list.map(m => (
          <a key={m.id} href={m.website} target="_blank" rel="noopener noreferrer"
            className="min-card" style={{ borderTopColor: m.color }}>
            <div className="min-icon" style={{ background: m.color + '22', color: m.color }}>
              {m.icon}
            </div>
            <div className="min-info">
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
              <span className="min-link" style={{ color: m.color }}>زيارة الموقع الرسمي ↗</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
