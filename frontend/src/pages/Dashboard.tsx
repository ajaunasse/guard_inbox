import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  ScanLine,
  Trash2,
  Mail,
  TrendingUp,
  Ticket,
  Database,
  Activity,
  Calendar,
  Zap,
  Target,
} from 'lucide-react';
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

interface DashboardStats {
  totalPromoCodes: number;
  activePromoCodes: number;
  totalSavings: number;
  emailsScanned: number;
  storageSaved: number;
  thisMonthCodes: number;
  expiringSoon: number;
}

export const Dashboard = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPromoCodes: 0,
    activePromoCodes: 0,
    totalSavings: 0,
    emailsScanned: 0,
    storageSaved: 0,
    thisMonthCodes: 0,
    expiringSoon: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    accountId: number;
    setting: 'autoDelete';
  } | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const fetchData = async () => {
    try {
      const [accountsRes, jobsRes] = await Promise.all([
        api.get('/email-accounts'),
        api.get('/scans'),
      ]);
      setAccounts(accountsRes.data);
      setJobs(jobsRes.data);

      // Try to fetch stats, but don't fail if endpoint doesn't exist yet
      try {
        const statsRes = await api.get('/stats/dashboard');
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (statsError) {
        // Silently ignore 404 - endpoint not implemented yet
        if ((statsError as { response?: { status?: number } })?.response?.status !== 404) {
          console.error('Failed to fetch stats', statsError);
        }
      }
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

  const handleConnect = async (provider: string) => {
    if (provider !== 'gmail') {
      setToast({ message: 'This provider is coming soon!', type: 'info' });
      return;
    }

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

  const updateAccountSettings = async (
    accountId: number,
    settings: { autoDeleteEmails?: boolean; autoScanEnabled?: boolean }
  ) => {
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showProviderModal && (
        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}>
          <div className="modal-content provider-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Connect Email Account</h2>
            <p className="modal-description">
              Choose your email provider to start scanning for promo codes
            </p>

            <div className="provider-grid">
              <button
                className="provider-card active"
                onClick={() => {
                  setShowProviderModal(false);
                  handleConnect('gmail');
                }}
              >
                <div className="provider-icon">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                    alt="Gmail"
                  />
                </div>
                <div className="provider-info">
                  <h3>Gmail</h3>
                  <p>Google Workspace</p>
                </div>
                <div className="provider-badge">Available</div>
              </button>

              <button className="provider-card disabled" disabled>
                <div className="provider-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V4.13q0-.46.33-.8.33-.32.8-.32h13.94q.47 0 .8.33.33.33.33.8V12zM6.5 18V9.38q-.46-.46-.92-.92L3 6.88v10.24l3.5-3.5zm3.88 0v-4.62L7.88 16h2.5zm11 1V7.25l-4 3.88 4 3.88v4z" />
                  </svg>
                </div>
                <div className="provider-info">
                  <h3>Outlook</h3>
                  <p>Microsoft 365</p>
                </div>
                <div className="provider-badge coming-soon">Coming Soon</div>
              </button>

              <button className="provider-card disabled" disabled>
                <div className="provider-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <div className="provider-info">
                  <h3>Yahoo Mail</h3>
                  <p>Yahoo</p>
                </div>
                <div className="provider-badge coming-soon">Coming Soon</div>
              </button>

              <button className="provider-card disabled" disabled>
                <div className="provider-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="provider-info">
                  <h3>iCloud Mail</h3>
                  <p>Apple</p>
                </div>
                <div className="provider-badge coming-soon">Coming Soon</div>
              </button>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowProviderModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Enable Auto-Delete?</h2>
            <p>Scanned emails will be moved to your Gmail Trash after each scan.</p>

            <div className="confirm-details">
              <p>
                <strong>✅ What we'll do:</strong>
              </p>
              <ul>
                <li>All promo codes are saved in CleanBox (Promo Wall or Vault)</li>
                <li>Emails in Trash stay for 30 days before permanent deletion</li>
                <li>You can restore emails from Gmail Trash anytime</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowConfirmDialog(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmAutoDelete} className="btn btn-primary">
                Enable Auto-Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        {/* KPI Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card stat-card-primary">
            <div className="stat-icon">
              <Ticket size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Promo Codes</p>
              <p className="stat-value">{stats.activePromoCodes}</p>
              <p className="stat-sublabel">of {stats.totalPromoCodes} total</p>
            </div>
            <div className="stat-trend stat-trend-up">
              <TrendingUp size={16} />
              <span>+{stats.thisMonthCodes} this month</span>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-icon">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Savings</p>
              <p className="stat-value">${stats.totalSavings.toLocaleString()}</p>
              <p className="stat-sublabel">estimated value</p>
            </div>
            <div className="stat-badge">💰 Money Saved</div>
          </div>

          <div className="stat-card stat-card-info">
            <div className="stat-icon">
              <Mail size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Emails Scanned</p>
              <p className="stat-value">{stats.emailsScanned.toLocaleString()}</p>
              <p className="stat-sublabel">promotional emails</p>
            </div>
            <div className="stat-progress">
              <div className="stat-progress-bar" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-icon">
              <Database size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Storage Saved</p>
              <p className="stat-value">{stats.storageSaved} MB</p>
              <p className="stat-sublabel">inbox cleaned</p>
            </div>
            <div className="stat-badge">⚡ Auto-delete</div>
          </div>

          <div className="stat-card stat-card-secondary">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Scan Activity</p>
              <p className="stat-value">
                {jobs.find((j) => j.status === 'IN_PROGRESS') ? (
                  <span className="status-running">Running...</span>
                ) : (
                  'Idle'
                )}
              </p>
              <p className="stat-sublabel">
                {jobs.length > 0
                  ? `Last: ${new Date(jobs[0]?.createdAt).toLocaleDateString()}`
                  : 'No scans yet'}
              </p>
            </div>
            <button
              onClick={() => accounts.length > 0 && handleScan(accounts[0].id)}
              className="stat-action-btn"
            >
              <Zap size={16} />
              Quick Scan
            </button>
          </div>

          <div className="stat-card stat-card-alert">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Expiring Soon</p>
              <p className="stat-value">{stats.expiringSoon}</p>
              <p className="stat-sublabel">codes expire in 7 days</p>
            </div>
            {stats.expiringSoon > 0 && <div className="stat-alert">⚠️ Use them now!</div>}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Connected Accounts</h2>
            <button onClick={() => setShowProviderModal(true)} className="btn btn-primary">
              + Connect Email Account
            </button>
          </div>
          {accounts.length === 0 ? (
            <p className="empty-state">No accounts connected yet.</p>
          ) : (
            <div className="accounts-grid">
              {accounts.map((account) => (
                <div key={account.id} className="account-card">
                  <div className="account-header">
                    <div className="account-icon">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                        alt="Gmail"
                      />
                    </div>
                    <div className="account-info">
                      <span className="account-provider">Gmail</span>
                      <span className="account-id">ID: {account.googleUserId}</span>
                      {account.email && <span className="account-email">{account.email}</span>}
                    </div>
                  </div>

                  <div className="account-settings">
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">🗑️ Auto-delete after scan</span>
                        <span className="setting-description">
                          Move emails to trash after scanning
                        </span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={account.autoDeleteEmails}
                          onChange={() =>
                            handleToggleAutoDelete(account.id, account.autoDeleteEmails)
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-label">🤖 Auto-scan hourly</span>
                        <span className="setting-description">
                          Automatically scan for new emails
                        </span>
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
                    <button onClick={() => handleScan(account.id)} className="btn btn-scan">
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
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>#{job.id}</td>
                    <td>
                      <span
                        className={`status-badge status-${job.status.toLowerCase().replace('_', '-')}`}
                      >
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
