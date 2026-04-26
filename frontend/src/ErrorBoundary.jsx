import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>حدث خطأ غير متوقع</h2>
            <p>نعتذر عن الإزعاج، يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
            <button 
              className="btn btn-warning"
              onClick={() => window.location.reload()}
            >
              تحديث الصفحة
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>تفاصيل الخطأ (للمطورين)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
