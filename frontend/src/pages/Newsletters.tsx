import { Shield } from 'lucide-react';
import './ComingSoon.css';

export const Newsletters = () => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Shield size={64} />
        </div>
        <h1>Newsletters</h1>
        <p className="coming-soon-description">Aggregate your newsletters in one place</p>
        <span className="coming-soon-badge">Coming Soon</span>
      </div>
    </div>
  );
};
