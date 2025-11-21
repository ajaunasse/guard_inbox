import { Package } from 'lucide-react';
import './ComingSoon.css';

export const Tracking = () => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Package size={64} />
        </div>
        <h1>Package Tracking</h1>
        <p className="coming-soon-description">
          Track all your deliveries in one place. Get notifications when your packages are on their
          way.
        </p>
        <span className="coming-soon-badge">Coming Soon</span>
      </div>
    </div>
  );
};
