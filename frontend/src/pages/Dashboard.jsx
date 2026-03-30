import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { History as HistoryIcon, Activity, UploadCloud, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
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

  const handleDelete = async (id) => {
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

  const recentUploads = history.slice(0, 3);

  return (
    <div className="container dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
        <p>Your personal skin health dashboard</p>
      </div>

      <div className="dashboard-grid">
        <Link to="/history" className="glass-card stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon"><Activity /></div>
          <div className="stat-info">
            <h3>{history.length}</h3>
            <p>Total Scans</p>
          </div>
        </Link>
        
        <Link to="/upload" className="glass-card action-card">
          <UploadCloud className="action-icon" size={32} />
          <h3>New Scan</h3>
          <p>Upload a new image for analysis</p>
        </Link>
      </div>

      <div className="recent-activity">
        <div className="activity-header">
          <h2>Recent Scans</h2>
          {history.length > 0 && (
            <Link to="/history" className="view-all">View All <HistoryIcon size={16}/></Link>
          )}
        </div>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : history.length === 0 ? (
          <div className="glass-panel empty-state">
            <p>You haven't uploaded any images yet.</p>
            <Link to="/upload" className="btn btn-primary mt-4">Start First Scan</Link>
          </div>
        ) : (
          <div className="history-list">
            {recentUploads.map((item) => (
              <div key={item._id} className="glass-card history-item" style={{ position: 'relative' }}>
                <img src={`https://skin-this-app-m3qr.onrender.com${item.imageUrl}`} alt="Scan" className="history-thumb" />
                <div className="history-details" style={{ flexGrow: 1 }}>
                  <h4>{item.predictionLabel}</h4>
                  <p className="history-date">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="confidence-badge" style={{ marginRight: '30px' }}>
                  {item.confidenceScore}% match
                </div>
                <button 
                  onClick={() => handleDelete(item._id)} 
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  title="Delete Scan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
