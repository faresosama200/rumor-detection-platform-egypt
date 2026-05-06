import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppIcon from './AppIcon';
import { AWARENESS_MAP } from './awarenessContent';

export default function AwarenessSectionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const section = AWARENESS_MAP[slug];

  if (!section) {
    return (
      <div className="page-wrap">
        <div className="empty-box" style={{ marginTop: 24 }}>
          <span>📭</span>
          <p>القسم المطلوب غير موجود</p>
          <button className="btn-add" onClick={() => navigate('/home')}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap awareness-section-page">
      <div className="page-hero">
        <div className="awareness-hero-icon"><AppIcon name={section.icon} size={36} /></div>
        <h1>{section.title}</h1>
        <p>{section.desc}</p>
      </div>

      <div className="awareness-detail-grid">
        <section className="awareness-detail-card">
          <h3>الأساسيات</h3>
          <ul>
            {section.essentials.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="awareness-detail-card">
          <h3>قائمة تحقق سريعة</h3>
          <ul>
            {section.checklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="awareness-actions">
        <button className="btn-hero-main" onClick={() => navigate('/report')}>
          <AppIcon name="report" size={16} />
          الإبلاغ عن محتوى مشبوه
        </button>
        <button className="btn-hero-sec" onClick={() => navigate(`/articles?category=${encodeURIComponent(section.category)}`)}>
          <AppIcon name="articles" size={16} />
          استعراض مقالات مرتبطة
        </button>
      </div>
    </div>
  );
}
