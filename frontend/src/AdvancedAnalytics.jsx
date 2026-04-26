import { useState, useEffect } from 'react';

function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState({
    realTimeStats: {
      activeUsers: 0,
      onlineReports: 0,
      verificationRate: 0,
      aiAnalyses: 0
    },
    trends: {
      weeklyReports: [],
      monthlyGrowth: [],
      categoryDistribution: [],
      sentimentAnalysis: []
    },
    predictions: {
      nextWeekTrend: 0,
      riskAreas: [],
      recommendedActions: []
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching advanced analytics
    setTimeout(() => {
      setAnalytics({
        realTimeStats: {
          activeUsers: 342,
          onlineReports: 28,
          verificationRate: 87.5,
          aiAnalyses: 156
        },
        trends: {
          weeklyReports: [120, 145, 132, 167, 189, 201, 178],
          monthlyGrowth: [15, 23, 18, 29, 34, 28],
          categoryDistribution: [
            { category: 'صحة', value: 35, color: '#28a745' },
            { category: 'سياسة', value: 28, color: '#dc3545' },
            { category: 'اقتصاد', value: 22, color: '#ffc107' },
            { category: 'تقنية', value: 15, color: '#17a2b8' }
          ],
          sentimentAnalysis: [
            { sentiment: 'إيجابي', value: 45, color: '#28a745' },
            { sentiment: 'سلبي', value: 30, color: '#dc3545' },
            { sentiment: 'محايد', value: 25, color: '#6c757d' }
          ]
        },
        predictions: {
          nextWeekTrend: 12.5,
          riskAreas: ['الشائعات الصحية', 'المعلومات السياسية', 'الأخبار الاقتصادية'],
          recommendedActions: [
            'زيادة التحقق من المصادر الطبية',
            'توسيع فريق المراجعين',
            'تحديث نظام AI التحليلي'
          ]
        }
      });
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">جاري تحليل البيانات المتقدمة...</p>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">
          📊 التحليلات المتقدمة والذكاء الاصطناعي
        </h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-warning btn-sm">
            📥 تصدير التقرير
          </button>
          <button className="btn btn-warning btn-sm">
            🔄 تحديث الآن
          </button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3 hover-lift" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <i className="bi bi-people-fill text-success fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">المستخدمون النشطون</h6>
                <h3 className="mb-0 text-success">{analytics.realTimeStats.activeUsers}</h3>
                <small className="text-success">+12% من أمس</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3 hover-lift" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <i className="bi bi-file-text-fill text-warning fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">البلاغات الحالية</h6>
                <h3 className="mb-0 text-warning">{analytics.realTimeStats.onlineReports}</h3>
                <small className="text-warning">قيد المراجعة</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3 hover-lift" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-info bg-opacity-10 p-3">
                  <i className="bi bi-graph-up-arrow text-info fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">معدل التحقق</h6>
                <h3 className="mb-0 text-info">{analytics.realTimeStats.verificationRate}%</h3>
                <small className="text-info">ممتاز</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3 hover-lift" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i className="bi bi-robot text-primary fs-4"></i>
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">تحليلات AI</h6>
                <h3 className="mb-0 text-primary">{analytics.realTimeStats.aiAnalyses}</h3>
                <small className="text-primary">اليوم</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Trends */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">📈 اتجاهات الأسبوع</h5>
            <div className="chart-container">
              <div className="simple-chart">
                {analytics.trends.weeklyReports.map((value, index) => (
                  <div key={index} className="chart-bar" style={{ 
                    height: `${(value / Math.max(...analytics.trends.weeklyReports)) * 100}%`,
                    background: 'var(--gold)',
                    margin: '0 5px',
                    borderRadius: '4px 4px 0 0'
                  }}>
                    <div className="chart-value" style={{ 
                      position: 'absolute', 
                      top: '-20px', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      color: 'var(--text-light)',
                      fontSize: '0.8rem'
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-labels d-flex justify-content-between mt-2">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>سبت</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>أحد</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>إثنين</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ثلاثاء</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>أربعاء</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>خميس</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>جمعة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">🎯 التنبؤات</h5>
            <div className="prediction-item mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ color: 'var(--text-light)' }}>اتجاه الأسبوع القادم</span>
                <span className="badge bg-success">+{analytics.predictions.nextWeekTrend}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ 
                    width: `${analytics.predictions.nextWeekTrend * 5}%`,
                    background: 'var(--gold)'
                  }}
                ></div>
              </div>
            </div>

            <div className="risk-areas mb-3">
              <h6 style={{ color: 'var(--text-light)', marginBottom: '10px' }}>مناطق الخطر المحتملة:</h6>
              {analytics.predictions.riskAreas.map((area, index) => (
                <div key={index} className="risk-item d-flex align-items-center mb-2">
                  <span className="badge bg-danger me-2">⚠️</span>
                  <span style={{ color: 'var(--text-light)' }}>{area}</span>
                </div>
              ))}
            </div>

            <div className="recommended-actions">
              <h6 style={{ color: 'var(--text-light)', marginBottom: '10px' }}>الإجراءات الموصى بها:</h6>
              {analytics.predictions.recommendedActions.map((action, index) => (
                <div key={index} className="action-item d-flex align-items-center mb-2">
                  <span className="badge bg-info me-2">💡</span>
                  <span style={{ color: 'var(--text-light)' }}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">📊 توزيع الفئات</h5>
            <div className="category-chart">
              {analytics.trends.categoryDistribution.map((category, index) => (
                <div key={index} className="category-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ color: 'var(--text-light)' }}>{category.category}</span>
                    <span style={{ color: category.color }}>{category.value}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${category.value * 2}%`,
                        background: category.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
            <h5 className="mb-3 text-warning">🎭 تحليل المشاعر</h5>
            <div className="sentiment-chart">
              {analytics.trends.sentimentAnalysis.map((sentiment, index) => (
                <div key={index} className="sentiment-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ color: 'var(--text-light)' }}>{sentiment.sentiment}</span>
                    <span style={{ color: sentiment.color }}>{sentiment.value}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${sentiment.value * 2}%`,
                        background: sentiment.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
