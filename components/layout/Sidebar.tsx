// components/layout/Sidebar.tsx
'use client';

import Avatar from '@/components/ui/Avatar';

interface NavItem { id: string; icon: string; label: string; badge?: number; }
interface Props {
  page: string;
  setPage: (p: string) => void;
  user: { id: string; name: string; role: string };
  onLogout: () => void;
  customerCount: number;
  myCount: number;
}

export default function Sidebar({ page, setPage, user, onLogout, customerCount, myCount }: Props) {
  const isAdmin = user.role === 'admin';

  const adminNav: NavItem[] = [
    { id: 'dashboard',   icon: '◼', label: 'Dashboard' },
    { id: 'customers',   icon: '👤', label: 'Müşteriler',  badge: customerCount },
    { id: 'performance', icon: '📊', label: 'Performans' },
    { id: 'users',       icon: '⚙',  label: 'Kullanıcılar' },
  ];

  const userNav: NavItem[] = [
    { id: 'dashboard', icon: '◼', label: 'Dashboard' },
    { id: 'customers', icon: '👤', label: 'Müşterilerim', badge: myCount },
  ];

  const nav = isAdmin ? adminNav : userNav;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🛡</div>
          <div>
            <div className="logo-text">Digipoli</div>
            <div className="logo-sub">CRM Panel</div>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Menü</div>
          {nav.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
              {n.badge != null && n.badge > 0 && (
                <span className="nav-badge">{n.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">Sistem</div>
          <button
            className={`nav-item ${page === 'webhook' ? 'active' : ''}`}
            onClick={() => setPage('webhook')}
          >
            <span className="icon">🔗</span>
            <span>Webhook</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="webhook-dot" />
            </span>
          </button>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-card">
          <Avatar name={user.name} size={34} />
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{isAdmin ? 'Yönetici' : 'Danışman'}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Çıkış">✕</button>
        </div>
      </div>
    </div>
  );
}
