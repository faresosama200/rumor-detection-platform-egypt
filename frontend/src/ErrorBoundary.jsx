import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return <div className="text-center py-5"><h3>⚠️ حدث خطأ غير متوقع</h3><button className="btn btn-warning mt-3" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button></div>;
    return this.props.children;
  }
}

export default ErrorBoundary;
