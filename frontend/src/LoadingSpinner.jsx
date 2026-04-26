import React from 'react';

function LoadingSpinner({ message = 'جاري التحميل...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner-container">
          <div className="gold-spinner"></div>
          <div className="gold-spinner-delay"></div>
          <div className="gold-spinner-delay-more"></div>
        </div>
        <h3 className="loading-message">{message}</h3>
        <div className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
