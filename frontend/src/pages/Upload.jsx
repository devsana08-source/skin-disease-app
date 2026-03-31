import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, X, AlertCircle, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError('');
    } else {
      setError('Please select a valid image file (jpeg, png)');
      setFile(null);
      setPreview(null);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      };

      const { data } = await axios.post('https://skin-disease-app-m3qr.onrender.com/predict', formData, config);
      navigate('/result', { state: { resultData: data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container upload-container">
      <div className="upload-header">
        <h1>AI Skin Analysis</h1>
        <p>Upload a clear image of your skin concern for an instant AI assessment.</p>
      </div>

      <div className="glass-panel upload-card">
        {error && (
          <div className="upload-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {!preview ? (
          <div 
            className="dropzone" 
            onClick={() => fileInputRef.current.click()}
          >
            <UploadCloud size={48} className="dropzone-icon" />
            <h3>Click or Drag & Drop to Upload</h3>
            <p>PNG, JPG up to 10MB</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              hidden 
            />
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-img-wrapper">
              <img src={preview} alt="Preview" className="preview-img" />
              <button 
                className="btn-clear" 
                onClick={clearSelection}
                disabled={isUploading}
              >
                <X size={16} />
              </button>
            </div>
            
            {isUploading ? (
              <div className="upload-loading">
                <div className="spinner"></div>
                <h4>Analyzing Image...</h4>
                <p>Our AI is processing your upload. This usually takes a moment.</p>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-lg upload-btn-action" 
                onClick={handleUpload}
              >
                Start Analysis <Activity size={18} />
              </button>
            )}
          </div>
        )}
        
        <div className="upload-guidelines">
          <h4>Guidelines for best results:</h4>
          <ul>
            <li>Ensure the image is well-lit and in focus</li>
            <li>Capture the affected area up close</li>
            <li>Avoid blurry or overly dark images</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
