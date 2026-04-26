import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';
import { useNotifications } from './Notifications';
import LoadingSpinner from './LoadingSpinner';

function ReportReviewSystem() {
  const { user, isAdmin, isReviewer } = useAuth();
  const { success, error, warning } = useNotifications();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports-with-reviews', {
        params: { status: filter === 'all' ? null : filter, limit: 100 },
      });
      setReports(response.data.reports || []);
    } catch (err) {
      error('فشل تحميل البلاغات: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/full-review`);
      setSelectedReport(response.data);
    } catch (err) {
      error('فشل تحميل تفاصيل البلاغ: ' + (err.response?.data?.error || err.message));
    }
  };

  const submitReviewerAssessment = async (reportId, comment, status) => {
    try {
      await api.put(`/reports/${reportId}/reviewer-assessment`, {
        reviewerId: user.id,
        comment,
        status,
      });
      success('تم تقديم تقييم المراجع بنجاح');
      loadReports();
      loadReportDetails(reportId);
    } catch (err) {
      error('فشل تقديم التقييم: ' + (err.response?.data?.error || err.message));
    }
  };

  const submitAdminAssessment = async (reportId, comment, status) => {
    try {
      await api.put(`/reports/${reportId}/admin-assessment`, {
        adminId: user.id,
        comment,
        status,
      });
      success('تم تقديم تقييم المدير بنجاح');
      loadReports();
      loadReportDetails(reportId);
    } catch (err) {
      error('فشل تقديم التقييم: ' + (err.response?.data?.error || err.message));
    }
  };

  const submitSpokespersonAssessment = async (reportId, comment, status, finalVerdict) => {
    try {
      await api.put(`/reports/${reportId}/spokesperson-assessment`, {
        spokespersonId: user.id,
        comment,
        status,
        finalVerdict,
      });
      success('تم تقديم تقييم المتحدث الإعلامي بنجاح');
      loadReports();
      loadReportDetails(reportId);
    } catch (err) {
      error('فشل تقديم التقييم: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!selectedReport) {
    return (
      <div className="report-review-list">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4">📋 نظام مراجعة البلاغات</h2>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('all')}
            >
              جميع البلاغات
            </button>
            <button
              className={`btn btn-sm ${filter === 'true' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('true')}
            >
              مؤكد ✓
            </button>
            <button
              className={`btn btn-sm ${filter === 'false' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('false')}
            >
              غير مؤكد ✗
            </button>
            <button
              className={`btn btn-sm ${filter === 'unverified' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('unverified')}
            >
              قيد المراجعة ⏳
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>العنوان</th>
                  <th>المرسل</th>
                  <th>التصنيف</th>
                  <th>حالة المراجعة</th>
                  <th>الوضع النهائي</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.report_id}>
                    <td className="text-truncate">{report.title}</td>
                    <td>{report.reporter_name || 'مستخدم'}</td>
                    <td>
                      <span className="badge bg-info">{report.category}</span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <span className={`badge ${report.reviewer_status === 'approved' ? 'bg-success' : report.reviewer_status === 'rejected' ? 'bg-danger' : 'bg-secondary'}`}>
                          مراجع: {report.reviewer_status || 'معلق'}
                        </span>
                        <span className={`badge ${report.admin_status === 'approved' ? 'bg-success' : report.admin_status === 'rejected' ? 'bg-danger' : 'bg-secondary'}`}>
                          مدير: {report.admin_status || 'معلق'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          report.final_verdict === 'true'
                            ? 'bg-success'
                            : report.final_verdict === 'false'
                            ? 'bg-danger'
                            : 'bg-warning'
                        }`}
                      >
                        {report.final_verdict === 'true' ? '✓ صحيح' : report.final_verdict === 'false' ? '✗ خاطئ' : '⏳ قيد المراجعة'}
                      </span>
                    </td>
                    <td>{new Date(report.created_at).toLocaleDateString('ar')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => loadReportDetails(report.report_id)}
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="report-review-detail">
      <button className="btn btn-sm btn-secondary mb-3" onClick={() => setSelectedReport(null)}>
        ← العودة للقائمة
      </button>

      <div className="card border-0 shadow-sm mb-4 p-4">
        <h3 className="mb-3">{selectedReport.report?.title}</h3>

        <div className="row mb-4">
          <div className="col-md-6">
            <p>
              <strong>الوصف:</strong>
              <br />
              {selectedReport.report?.description}
            </p>
          </div>
          <div className="col-md-6">
            <p>
              <strong>المرسل:</strong> {selectedReport.report?.reporter_name || 'مستخدم'}
            </p>
            <p>
              <strong>التصنيف:</strong>{' '}
              <span className="badge bg-info">{selectedReport.report?.category}</span>
            </p>
            <p>
              <strong>التاريخ:</strong> {new Date(selectedReport.report?.created_at).toLocaleString('ar')}
            </p>
          </div>
        </div>

        {selectedReport.evidence && selectedReport.evidence.length > 0 && (
          <div className="mb-4">
            <h5>📎 الأدلة المرفقة:</h5>
            <div className="list-group">
              {selectedReport.evidence.map((file) => (
                <a href={file.file_path} target="_blank" rel="noopener noreferrer" className="list-group-item" key={file.evidence_id}>
                  {file.file_name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviewer Section */}
      {isReviewer && (
        <ReviewerAssessmentPanel
          report={selectedReport}
          onSubmit={submitReviewerAssessment}
        />
      )}

      {/* Admin Section */}
      {isAdmin && (
        <AdminAssessmentPanel
          report={selectedReport}
          onSubmit={submitAdminAssessment}
        />
      )}

      {/* Spokesperson Section */}
      {user?.role === 'spokesperson' && (
        <SpokespersonAssessmentPanel
          report={selectedReport}
          onSubmit={submitSpokespersonAssessment}
        />
      )}

      {/* Review History */}
      {selectedReport.review && (
        <ReviewHistoryPanel review={selectedReport.review} />
      )}
    </div>
  );
}

function ReviewerAssessmentPanel({ report, onSubmit }) {
  const [comment, setComment] = useState(report.review?.reviewer_comment || '');
  const [status, setStatus] = useState(report.review?.reviewer_status || 'pending');

  return (
    <div className="card border-warning mb-4 p-4">
      <h5 className="text-warning mb-3">🛡️ تقييم المراجع</h5>
      <div className="form-group mb-3">
        <label>الحالة:</label>
        <select
          className="form-control"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">معلق</option>
          <option value="approved">موافق</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>
      <div className="form-group mb-3">
        <label>التعليق:</label>
        <textarea
          className="form-control"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أدخل تعليقك على البلاغ..."
        />
      </div>
      <button
        className="btn btn-warning"
        onClick={() => onSubmit(report.report.report_id, comment, status)}
      >
        ✓ إرسال تقييم المراجع
      </button>
    </div>
  );
}

function AdminAssessmentPanel({ report, onSubmit }) {
  const [comment, setComment] = useState(report.review?.admin_comment || '');
  const [status, setStatus] = useState(report.review?.admin_status || 'pending');

  return (
    <div className="card border-info mb-4 p-4">
      <h5 className="text-info mb-3">👨‍💼 تقييم المدير</h5>
      <div className="form-group mb-3">
        <label>الحالة:</label>
        <select
          className="form-control"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">معلق</option>
          <option value="approved">موافق</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>
      <div className="form-group mb-3">
        <label>التعليق:</label>
        <textarea
          className="form-control"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أدخل ملاحظات المدير..."
        />
      </div>
      <button
        className="btn btn-info"
        onClick={() => onSubmit(report.report.report_id, comment, status)}
      >
        ✓ إرسال تقييم المدير
      </button>
    </div>
  );
}

function SpokespersonAssessmentPanel({ report, onSubmit }) {
  const [comment, setComment] = useState(report.review?.spokesperson_comment || '');
  const [status, setStatus] = useState(report.review?.spokesperson_status || 'pending');
  const [finalVerdict, setFinalVerdict] = useState(report.review?.final_verdict || 'unverified');

  return (
    <div className="card border-success mb-4 p-4">
      <h5 className="text-success mb-3">🎙️ تقييم المتحدث الإعلامي</h5>
      <div className="row mb-3">
        <div className="col-md-6">
          <label>الحالة:</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">معلق</option>
            <option value="approved">موافق</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
        <div className="col-md-6">
          <label>الحكم النهائي:</label>
          <select
            className="form-control"
            value={finalVerdict}
            onChange={(e) => setFinalVerdict(e.target.value)}
          >
            <option value="unverified">قيد المراجعة</option>
            <option value="true">✓ صحيح</option>
            <option value="false">✗ خاطئ</option>
          </select>
        </div>
      </div>
      <div className="form-group mb-3">
        <label>البيان الإعلامي:</label>
        <textarea
          className="form-control"
          rows="5"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="أدخل البيان الإعلامي الرسمي..."
        />
      </div>
      <button
        className="btn btn-success"
        onClick={() => onSubmit(report.report.report_id, comment, status, finalVerdict)}
      >
        ✓ نشر الحكم النهائي والبيان الإعلامي
      </button>
    </div>
  );
}

function ReviewHistoryPanel({ review }) {
  return (
    <div className="card mb-4 p-4">
      <h5 className="mb-3">📝 سجل المراجعة</h5>
      <div className="timeline">
        {review.reviewer_status && (
          <div className="timeline-item mb-3">
            <div className="badge bg-warning">مراجع</div>
            <p className="mt-2 mb-1">
              <strong>الحالة:</strong> {review.reviewer_status}
            </p>
            {review.reviewer_comment && (
              <p className="text-muted">
                <strong>التعليق:</strong> {review.reviewer_comment}
              </p>
            )}
          </div>
        )}

        {review.admin_status && (
          <div className="timeline-item mb-3">
            <div className="badge bg-info">مدير</div>
            <p className="mt-2 mb-1">
              <strong>الحالة:</strong> {review.admin_status}
            </p>
            {review.admin_comment && (
              <p className="text-muted">
                <strong>التعليق:</strong> {review.admin_comment}
              </p>
            )}
          </div>
        )}

        {review.spokesperson_status && (
          <div className="timeline-item">
            <div className="badge bg-success">متحدث إعلامي</div>
            <p className="mt-2 mb-1">
              <strong>الحالة:</strong> {review.spokesperson_status}
            </p>
            <p className="mb-1">
              <strong>الحكم النهائي:</strong>{' '}
              <span
                className={`badge ${
                  review.final_verdict === 'true'
                    ? 'bg-success'
                    : review.final_verdict === 'false'
                    ? 'bg-danger'
                    : 'bg-warning'
                }`}
              >
                {review.final_verdict === 'true'
                  ? '✓ صحيح'
                  : review.final_verdict === 'false'
                  ? '✗ خاطئ'
                  : '⏳ قيد المراجعة'}
              </span>
            </p>
            {review.spokesperson_comment && (
              <p className="text-muted">
                <strong>البيان الإعلامي:</strong> {review.spokesperson_comment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportReviewSystem;
