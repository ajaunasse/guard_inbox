import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, Tag, Trash2, Package, Shield, Newspaper, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/client';
import './Layout.css';

interface Stats {
  promos: number;
  vault: number;
  trash: number;
}

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<Stats>({ promos: 0, vault: 0, trash: 0 });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Link to="/">
            <img src="/clean-box-full-logo.png" alt="CleanBox" className="logo-img" />
          </Link>
        </div>
        <nav className="header-nav">
          {user ? (
            <button onClick={handleLogout} className="btn btn-text">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <div className="app-layout">
        {user && (
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <Link
                to="/dashboard"
                className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} className="sidebar-icon" />
                <span>Dashboard</span>
              </Link>
              <Link to="/promos" className={`sidebar-link ${isActive('/promos') ? 'active' : ''}`}>
                <Tag size={20} className="sidebar-icon" />
                <span>Promo Wall</span>
                {stats.promos > 0 && <span className="count-badge">{stats.promos}</span>}
              </Link>
              <Link to="/vault" className={`sidebar-link ${isActive('/vault') ? 'active' : ''}`}>
                <Ticket size={20} className="sidebar-icon" />
                <span>Promo Codes</span>
                {stats.vault > 0 && <span className="count-badge">{stats.vault}</span>}
              </Link>
              <Link to="/trash" className={`sidebar-link ${isActive('/trash') ? 'active' : ''}`}>
                <Trash2 size={20} className="sidebar-icon" />
                <span>Trash</span>
                {stats.trash > 0 && <span className="count-badge">{stats.trash}</span>}
              </Link>
              <Link
                to="/tracking"
                className={`sidebar-link ${isActive('/tracking') ? 'active' : ''}`}
              >
                <Package size={20} className="sidebar-icon" />
                <span>Package Tracking</span>
                <span className="coming-soon-label">Soon</span>
              </Link>
              <Link
                to="/phishing"
                className={`sidebar-link ${isActive('/phishing') ? 'active' : ''}`}
              >
                <Shield size={20} className="sidebar-icon" />
                <span>Phishing</span>
                <span className="coming-soon-label">Soon</span>
              </Link>
              <Link
                to="/newsletters"
                className={`sidebar-link ${isActive('/newsletters') ? 'active' : ''}`}
              >
                <Newspaper size={20} className="sidebar-icon" />
                <span>Newsletters</span>
                <span className="coming-soon-label">Soon</span>
              </Link>
            </nav>
          </aside>
        )}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
