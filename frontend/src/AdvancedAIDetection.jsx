import { useState, useEffect } from 'react';

function AdvancedAIDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('advanced');
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const aiModels = [
    { id: 'basic', name: 'النموذج الأساسي', accuracy: 85, speed: 'سريع' },
    { id: 'advanced', name: 'النموذج المتقدم', accuracy: 95, speed: 'متوسط' },
    { id: 'deep', name: 'النموذج العميق', accuracy: 98, speed: 'بطيء' }
  ];

  useEffect(() => {
    // Load sample analysis history
    const history = [
      {
        id: 1,
        text: 'لقاح كورونا يسبب العقم',
        result: 'false',
        confidence: 98,
        timestamp: new Date(Date.now() - 3600000),
        model: 'advanced'
      },
      {
        id: 2,
        text: 'السفر إلى المريخ أصبح ممكناً',
        result: 'partially_true',
        confidence: 72,
        timestamp: new Date(Date.now() - 7200000),
        model: 'basic'
      }
    ];
    setAnalysisHistory(history);
  }, []);

  const analyzeContent = async () => {
    if (!inputText.trim() && !inputUrl.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);

    // Simulate AI analysis
    setTimeout(() => {
      const results = {
        text: inputText || 'تحليل المحتوى من الرابط',
        url: inputUrl,
        result: Math.random() > 0.5 ? 'true' : Math.random() > 0.3 ? 'false' : 'partially_true',
        confidence: Math.floor(Math.random() * 30) + 70,
        model: selectedModel,
        timestamp: new Date(),
        details: {
          credibility: Math.floor(Math.random() * 40) + 60,
          bias: Math.floor(Math.random() * 30),
          emotional_tone: Math.random() > 0.5 ? 'neutral' : 'emotional',
          source_reliability: Math.floor(Math.random() * 30) + 70,
          fact_checking: Math.floor(Math.random() * 30) + 70
        },
        keywords: ['شائعة', 'معلومات', 'تحقق', 'مصدر'],
        related_reports: Math.floor(Math.random() * 10) + 1,
        recommendations: [
          'تحقق من المصدر الأصلي',
          'ابحث عن معلومات إضافية',
          'استشارة الخبراء في المجال'
        ]
      };

      setAnalysisResults(results);
      setIsAnalyzing(false);

      // Add to history
      setAnalysisHistory(prev => [results, ...prev].slice(0, 5));
    }, 2000 + Math.random() * 2000);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'true': return '#28a745';
      case 'false': return '#dc3545';
      case 'partially_true': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'true': return 'معلومات صحيحة';
      case 'false': return 'معلومات مضللة';
      case 'partially_true': return 'معلومات جزئياً صحيحة';
      default: return 'غير محدد';
    }
  };

  const getModelInfo = () => {
    return aiModels.find(model => model.id === selectedModel);
  };

  return (
    <div className="advanced-ai-detection">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">
          🧠 نظام الكشف المتقدم بالذكاء الاصطناعي
        </h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-warning btn-sm">
            📊 إحصائيات النظام
          </button>
          <button className="btn btn-warning btn-sm">
            ⚙️ إعدادات النماذج
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
        <h5 className="mb-3 text-warning">اختيار نموذج التحليل</h5>
        <div className="row g-3">
          {aiModels.map((model) => (
            <div key={model.id} className="col-md-4">
              <div 
                className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="model-header">
                  <h6>{model.name}</h6>
                  <span className="badge bg-warning">{model.accuracy}% دقة</span>
                </div>
                <div className="model-stats">
                  <div className="stat">
                    <span>الدقة</span>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${model.accuracy}%` }}></div>
                    </div>
                  </div>
                  <div className="stat">
                    <span>السرعة</span>
                    <span className="speed-badge">{model.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
        <h5 className="mb-3 text-warning">محتوى للتحليل</h5>
        <div className="mb-3">
          <label className="form-label">النص المراد تحليله</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="أدخل النص الذي تريد التحقق منه..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">رابط المصدر (اختياري)</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-warning btn-lg"
          onClick={analyzeContent}
          disabled={isAnalyzing || (!inputText.trim() && !inputUrl.trim())}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              جاري التحليل باستخدام {getModelInfo().name}...
            </>
          ) : (
            '🔍 بدء التحليل'
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
          <h5 className="mb-3 text-warning">نتائج التحليل</h5>
          <div className="result-summary">
            <div className="result-header">
              <h4 style={{ color: getResultColor(analysisResults.result) }}>
                {getResultText(analysisResults.result)}
              </h4>
              <div className="confidence-meter">
                <span>مستوى الثقة: {analysisResults.confidence}%</span>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${analysisResults.confidence}%`,
                      background: getResultColor(analysisResults.result)
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">المصداقية</span>
                <div className="detail-value">
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{ width: `${analysisResults.details.credibility}%` }}></div>
                  </div>
                  <span>{analysisResults.details.credibility}%</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">التحيز</span>
                <div className="detail-value">
                  <div className="progress">
                    <div className="progress-bar bg-warning" style={{ width: `${analysisResults.details.bias}%` }}></div>
                  </div>
                  <span>{analysisResults.details.bias}%</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">موثوقية المصدر</span>
                <div className="detail-value">
                  <div className="progress">
                    <div className="progress-bar bg-info" style={{ width: `${analysisResults.details.source_reliability}%` }}></div>
                  </div>
                  <span>{analysisResults.details.source_reliability}%</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">التحقق من الحقائق</span>
                <div className="detail-value">
                  <div className="progress">
                    <div className="progress-bar bg-primary" style={{ width: `${analysisResults.details.fact_checking}%` }}></div>
                  </div>
                  <span>{analysisResults.details.fact_checking}%</span>
                </div>
              </div>
            </div>

            <div className="recommendations mt-4">
              <h6>توصيات إضافية:</h6>
              <ul className="list-unstyled">
                {analysisResults.recommendations.map((rec, index) => (
                  <li key={index} className="mb-2">
                    <span className="badge bg-warning me-2">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Analysis History */}
      <div className="card border-0 shadow-sm p-4" style={{ background: '#1a1a1a', borderColor: 'var(--gold)' }}>
        <h5 className="mb-3 text-warning">سجل التحليلات</h5>
        <div className="history-list">
          {analysisHistory.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-content">
                <div className="history-text">{item.text}</div>
                <div className="history-meta">
                  <span className="badge" style={{ backgroundColor: getResultColor(item.result) }}>
                    {getResultText(item.result)}
                  </span>
                  <span className="text-muted">{item.confidence}% ثقة</span>
                  <span className="text-muted">{item.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdvancedAIDetection;
