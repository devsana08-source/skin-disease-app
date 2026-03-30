import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">
          Early Detection for Better <span className="gradient-text">Skin Health</span>
        </h1>
        <p className="hero-subtitle">
          Upload an image of your skin concern and our advanced AI model will analyze it for potential conditions instantly.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Login</Link>
        </div>
      </div>

      <div className="features-grid container">
        <div className="glass-card feature-card">
          <div className="feature-icon"><Zap size={32} color="#4F46E5" /></div>
          <h3>Instant AI Analysis</h3>
          <p>Get immediate insights on potential skin conditions using state-of-the-art Convolutional Neural Networks.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon"><ShieldCheck size={32} color="#10B981" /></div>
          <h3>Secure & Private</h3>
          <p>Your data is encrypted and secure. We respect your privacy and never share your images.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon"><Activity size={32} color="#F59E0B" /></div>
          <h3>Track History</h3>
          <p>Keep a comprehensive log of your past uploads and predictions to monitor changes over time.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
