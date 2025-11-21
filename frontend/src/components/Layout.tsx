import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Tag, Lock, Trash2, Package, Shield } from 'lucide-react';
import './Layout.css';

export const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <Link to="/">GuardInbox</Link>
                </div>
                <nav className="header-nav">
                    {user ? (
                        <button onClick={handleLogout} className="btn btn-text">Logout</button>
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
                            <Link
                                to="/promos"
                                className={`sidebar-link ${isActive('/promos') ? 'active' : ''}`}
                            >
                                <Tag size={20} className="sidebar-icon" />
                                <span>Promo Wall</span>
                            </Link>
                            <Link
                                to="/vault"
                                className={`sidebar-link ${isActive('/vault') ? 'active' : ''}`}
                            >
                                <Lock size={20} className="sidebar-icon" />
                                <span>Vault</span>
                            </Link>
                            <Link
                                to="/trash"
                                className={`sidebar-link ${isActive('/trash') ? 'active' : ''}`}
                            >
                                <Trash2 size={20} className="sidebar-icon" />
                                <span>Trash</span>
                            </Link>
                            <Link
                                to="/tracking"
                                className={`sidebar-link ${isActive('/tracking') ? 'active' : ''}`}
                            >
                                <Package size={20} className="sidebar-icon" />
                                <span>Tracking</span>
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
