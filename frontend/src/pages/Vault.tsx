import { useEffect, useState } from 'react';
import api from '../api/client';
import { Toast } from '../components/Toast';
import './Vault.css';

interface PromoCode {
  id: number;
  code: string;
  discountRaw: string | null;
  brand: string;
  summary: string | null;
  category: string;
  url: string | null;
  expiresAt: string | null;
  email: {
    subject: string;
    sentAt: string;
  };
}

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    Fashion: '#ec4899',
    Technology: '#3b82f6',
    'Sports & Fitness': '#10b981',
    'Beauty & Health': '#f97316',
    'Food & Beverage': '#eab308',
    'Home & Garden': '#8b5cf6',
    Travel: '#06b6d4',
    Entertainment: '#ef4444',
    'Books & Media': '#6366f1',
    Services: '#64748b',
    Other: '#9ca3af',
  };
  return colors[category] || colors['Other'];
};

const isExpiringSoon = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
};

const isExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const formatExpiryDate = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  return new Date(expiresAt).toLocaleDateString();
};

const getBrandUrl = (brand: string): string => {
  // Simple heuristic: Google search for the brand
  return `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
};

const CATEGORIES = [
  'All',
  'Fashion',
  'Technology',
  'Sports & Fitness',
  'Beauty & Health',
  'Food & Beverage',
  'Home & Garden',
  'Travel',
  'Entertainment',
  'Books & Media',
  'Services',
  'Other',
];

export const Vault = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchBrand, setSearchBrand] = useState<string>('');
  const [showExpired, setShowExpired] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await api.get('/promo-codes');
        // Sort: expiring soon first, then by expiry date, then by created date
        const sorted = res.data.data.sort((a: PromoCode, b: PromoCode) => {
          const aExpiringSoon = isExpiringSoon(a.expiresAt);
          const bExpiringSoon = isExpiringSoon(b.expiresAt);

          if (aExpiringSoon && !bExpiringSoon) return -1;
          if (!aExpiringSoon && bExpiringSoon) return 1;

          if (a.expiresAt && b.expiresAt) {
            return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          }

          return new Date(b.email.sentAt).getTime() - new Date(a.email.sentAt).getTime();
        });
        setCodes(sorted);
      } catch (error) {
        console.error('Failed to fetch codes', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodes();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Code copied to clipboard!', type: 'success' });
  };

  // Filter codes based on selected category, brand search, and expiry status
  const filteredCodes = codes.filter((code) => {
    // Category filter
    const matchesCategory = selectedCategory === 'All' || code.category === selectedCategory;

    // Brand filter
    const matchesBrand =
      searchBrand === '' || code.brand?.toLowerCase().includes(searchBrand.toLowerCase());

    // Expiry filter - hide expired unless showExpired is true
    const expired = isExpired(code.expiresAt);
    const matchesExpiryFilter = showExpired || !expired;

    return matchesCategory && matchesBrand && matchesExpiryFilter;
  });

  if (isLoading) return <div>Loading vault...</div>;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="vault-container">
        <div className="vault-header">
          <div className="vault-header-left">
            <h1>Promo Vault</h1>
            <p>Your collection of active codes</p>
          </div>
          {codes.length > 0 && (
            <div className="vault-header-right">
              <div className="vault-search">
                <input
                  type="text"
                  placeholder="Search by brand..."
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  className="vault-search-input"
                />
                {searchBrand && (
                  <button onClick={() => setSearchBrand('')} className="clear-search">
                    ✕
                  </button>
                )}
              </div>
              <div className="toggle-container">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={showExpired}
                    onChange={(e) => setShowExpired(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">Show expired</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Category Filters */}
        {codes.length > 0 && (
          <div className="category-filters">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                style={
                  selectedCategory === category
                    ? category === 'All'
                      ? { backgroundColor: '#4f46e5', color: 'white', borderColor: 'transparent' }
                      : {
                          backgroundColor: getCategoryColor(category),
                          color: 'white',
                          borderColor: 'transparent',
                        }
                    : {}
                }
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {codes.length === 0 ? (
          <div className="empty-state-large">
            <h3>No codes in vault yet</h3>
            <p>Your saved promo codes will appear here.</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="empty-state-large">
            <h3>No codes match your filters</h3>
            <p>Try adjusting your category or brand search.</p>
          </div>
        ) : (
          <div className="vault-list">
            {filteredCodes.map((code) => {
              const expiringSoon = isExpiringSoon(code.expiresAt);
              const expired = isExpired(code.expiresAt);

              return (
                <a
                  key={code.id}
                  href={code.url || getBrandUrl(code.brand)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`vault-item ${expired ? 'expired' : ''}`}
                >
                  <div className="vault-item-left">
                    <div className="vault-header-row">
                      <div className="vault-vendor">{code.brand}</div>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(code.category) }}
                      >
                        {code.category}
                      </span>
                      {expiringSoon && !expired && (
                        <span className="expire-soon-badge">Expires soon!</span>
                      )}
                      {expired && <span className="expired-badge">Expired</span>}
                    </div>
                    <div className="vault-discount">{code.discountRaw}</div>
                    <div className="vault-subject">{code.summary || code.email.subject}</div>
                    {code.expiresAt && (
                      <div
                        className={`vault-expiry ${expiringSoon ? 'expiring-soon' : ''} ${expired ? 'expired' : ''}`}
                      >
                        Expires: {formatExpiryDate(code.expiresAt)}
                      </div>
                    )}
                  </div>
                  <div className="vault-item-right">
                    <div
                      className="code-display"
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard(code.code);
                      }}
                    >
                      {code.code}
                      <span className="copy-icon" title="Copy">
                        📋
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
