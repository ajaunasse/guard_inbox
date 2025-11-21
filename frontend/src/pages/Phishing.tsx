import { Shield } from 'lucide-react';
import './ComingSoon.css';

export const Phishing = () => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Shield size={64} />
        </div>
        <h1>Phishing Protection</h1>
        <p className="coming-soon-description">
          Detect and protect yourself from phishing emails with our advanced security database.
        </p>
        <span className="coming-soon-badge">Coming Soon</span>
      </div>
    </div>
  );
};
