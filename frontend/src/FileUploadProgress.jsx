import { useState } from 'react';

function FileUploadProgress() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
      return allowedTypes.includes(file.type) && file.size <= 15 * 1024 * 1024;
    });

    const filesWithProgress = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      progress: 0,
      status: 'pending',
      error: null
    }));

    setFiles(prev => [...prev, ...filesWithProgress]);
    
    // Simulate upload progress
    filesWithProgress.forEach(fileObj => {
      simulateUpload(fileObj);
    });
  };

  const simulateUpload = (fileObj) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileObj.id]: 0
    }));

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[fileObj.id] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 20, 100);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ));
          
          // Remove completed file after 2 seconds
          setTimeout(() => {
            setFiles(prev => prev.filter(f => f.id !== fileObj.id));
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileObj.id];
              return newProgress;
            });
          }, 2000);
        }
        
        return {
          ...prev,
          [fileObj.id]: newProgress
        };
      });
    }, 300);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📁';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--text-muted)';
      case 'uploading': return 'var(--gold)';
      case 'completed': return '#28a745';
      case 'error': return '#dc3545';
      default: return 'var(--text-light)';
    }
  };

  return (
    <div className="file-upload-progress">
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h5>اسحب وأفلت الملفات هنا</h5>
          <p className="text-muted">أو انقر لاختيار الملفات</p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
            onChange={handleFileSelect}
            className="file-input"
          />
          <button className="btn btn-warning">
            اختر الملفات
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="upload-list mt-4">
          <h6 className="mb-3">الملفات قيد الرفع ({files.length})</h6>
          {files.map((fileObj) => (
            <div key={fileObj.id} className="upload-item">
              <div className="file-info">
                <div className="file-icon">{getStatusIcon(fileObj.status)}</div>
                <div className="file-details">
                  <div className="file-name">{fileObj.file.name}</div>
                  <div className="file-size">{formatFileSize(fileObj.file.size)}</div>
                </div>
              </div>
              
              <div className="upload-progress-container">
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${uploadProgress[fileObj.id] || 0}%`,
                      background: getStatusColor(fileObj.status)
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {Math.round(uploadProgress[fileObj.id] || 0)}%
                </div>
              </div>
              
              <button 
                className="remove-file"
                onClick={() => removeFile(fileObj.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="upload-info mt-3">
        <small className="text-muted">
          <div>• الملفات المسموحة: الصور (JPG, PNG, WEBP)، PDF، الفيديو (MP4)</div>
          <div>• الحد الأقصى لحجم الملف: 15 ميجابايت</div>
          <div>• الحد الأقصى لعدد الملفات: 5 ملفات في المرة الواحدة</div>
        </small>
      </div>
    </div>
  );
}

export default FileUploadProgress;
