import { useEffect, useState } from 'react';
import api from '../api/client';
import { ScanLine, Trash2, Mail } from 'lucide-react';
import './Dashboard.css';

interface EmailAccount {
    id: number;
    googleUserId: string;
    email: string | null;
    createdAt: string;
}

interface ScanJob {
    id: number;
    status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
    createdAt: string;
}

export const Dashboard = () => {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [jobs, setJobs] = useState<ScanJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            alert('Scan started! It will run in the background.');
        } catch (error) {
            console.error('Failed to start scan', error);
        }
    };

    if (isLoading) return <div>Loading dashboard...</div>;

    return (
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
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td>
                                        <span className={`status-badge status-${job.status.toLowerCase()}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};
