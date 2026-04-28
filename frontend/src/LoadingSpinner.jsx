function LoadingSpinner({ message = 'جارٍ التحميل...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="spinner-border text-warning" role="status" />
      <p style={{ marginTop: 12, color: '#888' }}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
