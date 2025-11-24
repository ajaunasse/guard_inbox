import { useEffect, useState } from 'react';
import api from '../api/client';
import { ScanLine, Trash2, Mail } from 'lucide-react';
import { Toast } from '../components/Toast';
import './Dashboard.css';

interface EmailAccount {
    id: number;
    googleUserId: string;
    email: string | null;
    autoDeleteEmails: boolean;
    autoScanEnabled: boolean;
    createdAt: string;
}

interface ScanJob {
    id: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    emailsScanned?: number | null;
    createdAt: string;
}

export const Dashboard = () => {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [jobs, setJobs] = useState<ScanJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState<{ accountId: number; setting: 'autoDelete' } | null>(null);

    const fetchData = async () => {
        try {
            const [accountsRes, jobsRes] = await Promise.all([
                api.get('/email-accounts'),
                api.get('/scans')
            ]);
            setAccounts(accountsRes.data);
            setJobs(jobsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll for job updates
        return () => clearInterval(interval);
    }, []);

    const handleConnect = async () => {
        try {
            const res = await api.get('/email-accounts/connect');
            window.location.href = res.data.url;
        } catch (error) {
            console.error('Failed to get connect URL', error);
        }
    };

    const handleDisconnect = async (id: number) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        try {
            await api.delete(`/email-accounts/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to disconnect', error);
        }
    };

    const handleScan = async (accountId: number) => {
        try {
            await api.post('/scans', { emailAccountId: accountId });
            fetchData();
            setToast({ message: 'Scan started! It will run in the background.', type: 'info' });
        } catch (error) {
            console.error('Failed to start scan', error);
            setToast({ message: 'Failed to start scan. Please try again.', type: 'error' });
        }
    };

    const handleToggleAutoDelete = async (accountId: number, currentValue: boolean) => {
        // Show confirmation dialog when enabling auto-delete
        if (!currentValue) {
            setShowConfirmDialog({ accountId, setting: 'autoDelete' });
            return;
        }

        // Disable without confirmation
        await updateAccountSettings(accountId, { autoDeleteEmails: false });
    };

    const confirmAutoDelete = async () => {
        if (!showConfirmDialog) return;
        await updateAccountSettings(showConfirmDialog.accountId, { autoDeleteEmails: true });
        setShowConfirmDialog(null);
    };

    const handleToggleAutoScan = async (accountId: number, currentValue: boolean) => {
        await updateAccountSettings(accountId, { autoScanEnabled: !currentValue });
    };

    const updateAccountSettings = async (accountId: number, settings: { autoDeleteEmails?: boolean; autoScanEnabled?: boolean }) => {
        try {
            await api.patch(`/email-accounts/${accountId}/settings`, settings);
            fetchData();
            setToast({ message: 'Settings updated successfully', type: 'success' });
        } catch (error) {
            console.error('Failed to update settings', error);
            setToast({ message: 'Failed to update settings. Please try again.', type: 'error' });
        }
    };

    if (isLoading) return <div>Loading dashboard...</div>;

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {showConfirmDialog && (
                <div className="modal-overlay" onClick={() => setShowConfirmDialog(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Enable Auto-Delete?</h2>
                        <p>Scanned emails will be moved to your Gmail Trash after each scan.</p>

                        <div className="confirm-details">
                            <p><strong>✅ What we'll do:</strong></p>
                            <ul>
                                <li>All promo codes are saved in CleanBox (Promo Wall or Vault)</li>
                                <li>Emails in Trash stay for 30 days before permanent deletion</li>
                                <li>You can restore emails from Gmail Trash anytime</li>
                            </ul>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowConfirmDialog(null)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAutoDelete}
                                className="btn btn-primary"
                            >
                                Enable Auto-Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <button onClick={handleConnect} className="btn btn-primary">
                    + Connect Gmail Account
                </button>
            </div>

            <section className="dashboard-section">
                <h2>Connected Accounts</h2>
                {accounts.length === 0 ? (
                    <p className="empty-state">No accounts connected yet.</p>
                ) : (
                    <div className="accounts-grid">
                        {accounts.map(account => (
                            <div key={account.id} className="account-card">
                                <div className="account-header">
                                    <div className="account-icon">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" />
                                    </div>
                                    <div className="account-info">
                                        <span className="account-provider">Gmail</span>
                                        <span className="account-id">ID: {account.googleUserId}</span>
                                        {account.email && (
                                            <span className="account-email">{account.email}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="account-settings">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <span className="setting-label">🗑️ Auto-delete after scan</span>
                                            <span className="setting-description">Move emails to trash after scanning</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={account.autoDeleteEmails}
                                                onChange={() => handleToggleAutoDelete(account.id, account.autoDeleteEmails)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <span className="setting-label">🤖 Auto-scan hourly</span>
                                            <span className="setting-description">Automatically scan for new emails</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={account.autoScanEnabled}
                                                onChange={() => handleToggleAutoScan(account.id, account.autoScanEnabled)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="account-actions">
                                    <button
                                        onClick={() => handleScan(account.id)}
                                        className="btn btn-scan"
                                    >
                                        <ScanLine size={16} />
                                        Scan Now
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect(account.id)}
                                        className="btn btn-disconnect"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="dashboard-section">
                <h2>Recent Scans</h2>
                {jobs.length === 0 ? (
                    <p className="empty-state">No scans performed yet.</p>
                ) : (
                    <table className="jobs-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Emails Scanned</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td>
                                        <span className={`status-badge status-${job.status.toLowerCase().replace('_', '-')}`}>
                                            {job.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{job.emailsScanned ?? '-'}</td>
                                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
            </div>
        </>
    );
};
