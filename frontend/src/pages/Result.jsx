import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import './Result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state?.resultData;

  useEffect(() => {
    if (!resultData) {
      navigate('/upload');
    }
  }, [resultData, navigate]);

  if (!resultData) return null;

  const { imageUrl, prediction } = resultData;
  const confidence = prediction.confidence;
  const isHighConfidence = confidence >= 80;
  
  return (
    <div className="container result-container">
      <Link to="/upload" className="back-link">
        <ArrowLeft size={16} /> Back to Upload
      </Link>
      
      <div className="result-header">
        <h1>Analysis Complete</h1>
        <p>Review the AI prediction results below</p>
      </div>

      <div className="result-content">
        <div className="glass-panel image-section">
          <img src={`https://skin-this-app-m3qr.onrender.com${imageUrl}`} alt="Uploaded Skin" className="result-img" />
          
          <div className="result-actions image-actions">
            <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
            <Link to="/upload" className="btn btn-primary"><RefreshCw size={16}/> New Scan</Link>
          </div>
        </div>
        
        <div className="glass-panel details-section">
          <div className="prediction-box">
            <h3>Predicted Condition</h3>
            <div className="prediction-label">
              {prediction.prediction || prediction.main_prediction || prediction.label}
            </div>
            
            <div className="confidence-meter">
              <div className="confidence-header">
                <span>Confidence Score</span>
                <span className="confidence-value">{confidence}%</span>
              </div>
              <div className="progress-bg">
                <div 
                  className={`progress-fill ${isHighConfidence ? 'high' : 'medium'}`} 
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
            </div>

            {prediction.top_predictions && prediction.top_predictions.length > 0 && (
              <div className="top-predictions-list" style={{ marginTop: '20px', textAlign: 'left' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Other Possibilities:</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {prediction.top_predictions.slice(1).map((p, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                        <span>{p.label}</span> 
                        <span className="conf-badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{p.confidence}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {prediction.warning_if_low_confidence && (
            <div className="warning-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: '#FCA5A5' }}>
               <AlertTriangle size={24} />
               <p style={{ margin: 0, fontSize: '0.9rem' }}>{prediction.warning_if_low_confidence}</p>
            </div>
          )}

          <div className="disclaimer-box">
            <div className="disclaimer-header">
              <Info size={20} color="#F59E0B" />
              <h4>Medical Disclaimer</h4>
            </div>
            <p>{prediction.disclaimer || 'This application utilizes Artificial Intelligence to analyze skin images for early awareness and educational purposes. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider or dermatologist regarding any skin conditions.'}</p>
          </div>

          <div className="recommendations-box">
            <h4><Info size={18} /> Recommendations</h4>
            <ul>
              <li><CheckCircle size={14} color="#10B981"/> Consult a dermatologist for an accurate diagnosis.</li>
              <li><CheckCircle size={14} color="#10B981"/> Avoid scratching or self-treating the area.</li>
              <li><CheckCircle size={14} color="#10B981"/> Keep a log of any changes in size or color.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
