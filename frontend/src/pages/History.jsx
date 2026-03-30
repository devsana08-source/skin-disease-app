import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Activity, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import './History.css';

const History = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const { data } = await axios.get('/api/history', config);
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this scan?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/history/${id}`, config);
        setHistory(history.filter((item) => item._id !== id));
      } catch (error) {
        console.error('Error deleting history:', error);
        alert(`Deletion Failed: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleCardClick = (item) => {
    navigate('/result', {
      state: {
        resultData: {
          imageUrl: item.imageUrl,
          prediction: {
            prediction: item.predictionLabel,
            confidence: item.confidenceScore,
            top_predictions: item.topPredictions || [],
            warning_if_low_confidence: item.warning || null,
          },
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <Activity className="spinner-icon" size={48} />
        <h2>Loading History...</h2>
      </div>
    );
  }

  return (
    <div className="container history-page">
      <div className="history-header">
        <h1>Your Scan History</h1>
        <p>Review all your past skin analysis results</p>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel empty-history">
          <p>No scans found in your history.</p>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((item) => (
            <div key={item._id} className="glass-card history-card" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleCardClick(item)}>
              <div className="history-card-img" style={{ position: 'relative' }}>
                <img src={`http://localhost:5000${item.imageUrl}`} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {item.warning && (
                  <div className="warning-badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Low Conf
                  </div>
                )}
              </div>
              <div className="history-card-info" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', lineHeight: '1.4' }}>{item.predictionLabel}</h3>
                    {item.topPredictions && item.topPredictions.length > 1 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        + Other possibilities
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, item._id)} 
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    title="Delete Scan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="history-card-meta" style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="conf-badge">{item.confidenceScore}%</span>
                  <span className="date-badge"><Calendar size={12}/> {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
