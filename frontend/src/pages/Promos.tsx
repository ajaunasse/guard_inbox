import { useEffect, useState } from 'react';
import api from '../api/client';
import './Promos.css';

interface Promo {
  id: number;
  subject: string;
  from: string;
  sentAt: string;
  promoCodes: {
    code: string | null;
    discountRaw: string | null;
    brand: string;
    summary: string | null;
    category: string;
    url: string | null;
    expiresAt: string | null;
  }[];
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

export const Promos = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchBrand, setSearchBrand] = useState<string>('');
  const [showExpired, setShowExpired] = useState<boolean>(false);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await api.get('/promos');
        // Sort by expiring soon first
        const sorted = res.data.data.sort((a: Promo, b: Promo) => {
          const aExpiringSoon = a.promoCodes.some((pc) => isExpiringSoon(pc.expiresAt));
          const bExpiringSoon = b.promoCodes.some((pc) => isExpiringSoon(pc.expiresAt));

          if (aExpiringSoon && !bExpiringSoon) return -1;
          if (!aExpiringSoon && bExpiringSoon) return 1;

          return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
        });
        setPromos(sorted);
      } catch (error) {
        console.error('Failed to fetch promos', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromos();
  }, []);

  // Filter promos based on selected category, brand search, and expiry status
  const filteredPromos = promos.filter((promo) => {
    const firstCode = promo.promoCodes[0];

    // Category filter
    const matchesCategory = selectedCategory === 'All' || firstCode?.category === selectedCategory;

    // Brand filter
    const matchesBrand =
      searchBrand === '' || firstCode?.brand?.toLowerCase().includes(searchBrand.toLowerCase());

    // Expiry filter - hide expired unless showExpired is true
    const expired = firstCode && isExpired(firstCode.expiresAt);
    const matchesExpiryFilter = showExpired || !expired;

    return matchesCategory && matchesBrand && matchesExpiryFilter;
  });

  if (isLoading) return <div>Loading promos...</div>;

  return (
    <div className="promos-container">
      <div className="promos-header">
        <div className="promos-header-left">
          <h1>Promo Wall</h1>
          <p>Latest deals from your inbox</p>
        </div>
        {promos.length > 0 && (
          <div className="promos-header-right">
            <div className="promos-search">
              <input
                type="text"
                placeholder="Search by brand..."
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                className="promos-search-input"
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
      {promos.length > 0 && (
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

      {promos.length === 0 ? (
        <div className="empty-state-large">
          <h3>No promos found yet</h3>
          <p>Connect your Gmail account and start a scan to see deals here.</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="empty-state-large">
          <h3>No promos match your filters</h3>
          <p>Try adjusting your category or brand search.</p>
        </div>
      ) : (
        <div className="promos-grid">
          {filteredPromos.map((promo) => {
            const firstCode = promo.promoCodes[0];
            const expiringSoon = firstCode && isExpiringSoon(firstCode.expiresAt);
            const expired = firstCode && isExpired(firstCode.expiresAt);

            return (
              <a
                key={promo.id}
                href={firstCode?.url || (firstCode?.brand ? getBrandUrl(firstCode.brand) : '#')}
                target="_blank"
                rel="noopener noreferrer"
                className={`promo-card ${expired ? 'expired' : ''}`}
              >
                <div className="promo-header">
                  <div className="promo-vendor-row">
                    <span className="promo-vendor">{firstCode?.brand || promo.from}</span>
                    {firstCode?.category && (
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(firstCode.category) }}
                      >
                        {firstCode.category}
                      </span>
                    )}
                    {expiringSoon && !expired && (
                      <span className="expire-soon-badge">Expires soon!</span>
                    )}
                    {expired && <span className="expired-badge">Expired</span>}
                  </div>
                  <span className="promo-date">{new Date(promo.sentAt).toLocaleDateString()}</span>
                </div>
                <h3 className="promo-subject">{firstCode?.summary || promo.subject}</h3>

                <div className="promo-codes">
                  {promo.promoCodes.map((code, idx) => (
                    <div key={idx} className="code-badge">
                      {code.code ? (
                        <span className="code-value">{code.code}</span>
                      ) : (
                        <span className="discount-value">{code.discountRaw}</span>
                      )}
                      {code.code && code.discountRaw && (
                        <span className="code-discount">({code.discountRaw})</span>
                      )}
                    </div>
                  ))}
                </div>

                {firstCode?.expiresAt && (
                  <div
                    className={`promo-expiry ${expiringSoon ? 'expiring-soon' : ''} ${expired ? 'expired' : ''}`}
                  >
                    Expires: {formatExpiryDate(firstCode.expiresAt)}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
