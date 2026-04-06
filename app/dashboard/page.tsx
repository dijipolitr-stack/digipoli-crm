// app/dashboard/page.tsx
// ─── Ana CRM kabuğu: sidebar + topbar + sayfalar ──────────
'use client';

import { useState, useCallback, useEffect } from 'react';
import { NotifProvider } from '@/lib/NotifContext';
import Sidebar           from '@/components/layout/Sidebar';
import LoginPage         from '@/components/auth/LoginPage';
import DashboardPage     from '@/components/dashboard/DashboardPage';
import CustomersPage     from '@/components/customers/CustomersPage';
import PerformancePage   from '@/components/performance/PerformancePage';
import UsersPage         from '@/components/users/UsersPage';
import WebhookPage       from '@/components/webhook/WebhookPage';
import Avatar            from '@/components/ui/Avatar';

// ─── Types ────────────────────────────────────────────────
interface User {
  id: string; name: string; email: string;
  phone: string | null; role: string;
  active?: boolean; created_at?: string;
}

interface Customer {
  id: string; musteri_id: string; ad_soyad: string;
  kanal: string | null; tarih: string | null; saat: string | null;
  steki: string | null; stegi_ozel: string | null;
  konusma_ozeti: string | null; durum: string;
  atanan_id: string | null; notlar: string | null;
  atanan?: { id: string; name: string } | null;
}

type PageId = 'dashboard' | 'customers' | 'performance' | 'users' | 'webhook';

const PAGE_TITLES: Record<PageId, { title: string; sub: string }> = {
  dashboard:   { title: 'Dashboard',     sub: 'Genel bakış'              },
  customers:   { title: 'Müşteriler',    sub: 'Tüm başvurular'           },
  performance: { title: 'Performans',    sub: 'Danışman istatistikleri'  },
  users:       { title: 'Kullanıcılar',  sub: 'Ekip yönetimi'            },
  webhook:     { title: 'Webhook',       sub: 'n8n entegrasyonu'         },
};

// ─── App ──────────────────────────────────────────────────
export default function DashboardShell() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page,        setPage]        = useState<PageId>('dashboard');
  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(false);

  // ── Müşterileri yükle ─────────────────────────────────
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/customers?limit=200');
      const json = await res.json();
      setCustomers(json.data ?? []);
    } catch (e) {
      console.error('Müşteri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Kullanıcıları yükle ───────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      const res  = await fetch('/api/users');
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch (e) {
      console.error('Kullanıcı yükleme hatası:', e);
    }
  }, []);

  // ── Giriş sonrası veri çek ────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    loadCustomers();
    loadUsers();
  }, [currentUser, loadCustomers, loadUsers]);

  // ── Login ekranı ──────────────────────────────────────
  if (!currentUser) {
    return (
      <NotifProvider>
        <LoginPage onLogin={u => { setCurrentUser(u); setPage('dashboard'); }} />
      </NotifProvider>
    );
  }

  // ── CRUD Handlers ─────────────────────────────────────

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    const res  = await fetch(`/api/customers/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? 'Güncelleme başarısız');
    }
    // Optimistic UI: local state güncelle
    setCustomers(cs => cs.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const handleAddCustomer = async (data: Record<string, unknown>) => {
    const res  = await fetch('/api/customers', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Ekleme başarısız');
    // Yeni müşteriyi listeye ekle
    if (json.data) setCustomers(cs => [json.data, ...cs]);
  };

  const handleCreateUser = async (data: { name: string; email: string; phone: string; role: string }) => {
    const res  = await fetch('/api/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Kullanıcı eklenemedi');
    if (json.data) setUsers(us => [...us, json.data]);
  };

  const handleUpdateUser = async (id: string, data: Partial<User>) => {
    const res  = await fetch(`/api/users/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Güncelleme başarısız');
    if (json.data) setUsers(us => us.map(u => u.id === id ? json.data : u));
  };

  const handleDeactivateUser = async (id: string) => {
    const res  = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'İşlem başarısız');
    setUsers(us => us.map(u => u.id === id ? { ...u, active: false } : u));
  };

  // ── Yetki: admin olmayan sadece kendi sayfalarına erişir
  const isAdmin    = currentUser.role === 'admin';
  const myCount    = customers.filter(c => c.atanan_id === currentUser.id).length;
  const pt         = PAGE_TITLES[page] ?? { title: page, sub: '' };

  // Admin olmayan sayfaya girmeye çalışırsa dashboard'a yönlendir
  const safePage   = (!isAdmin && (page === 'users' || page === 'performance'))
    ? 'dashboard'
    : page;

  const pageProps = { customers, users, user: currentUser };

  return (
    <NotifProvider>
      <div className="app">
        <Sidebar
          page={safePage}
          setPage={p => setPage(p as PageId)}
          user={currentUser}
          onLogout={() => { setCurrentUser(null); setCustomers([]); setUsers([]); }}
          customerCount={customers.length}
          myCount={myCount}
        />

        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="page-title">{pt.title}</div>
              <div className="page-sub">{pt.sub}</div>
            </div>
            <div className="topbar-actions">
              {loading && <span className="loading-spinner" />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', background: 'var(--bg3)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span className="webhook-dot" />
                <span>n8n Bağlı</span>
              </div>
              <Avatar name={currentUser.name} size={32} />
            </div>
          </div>

          {/* Sayfa İçeriği */}
          {safePage === 'dashboard' && (
            <DashboardPage {...pageProps} setPage={p => setPage(p as PageId)} />
          )}
          {safePage === 'customers' && (
            <CustomersPage
              {...pageProps}
              onUpdateCustomer={handleUpdateCustomer}
              onAddCustomer={handleAddCustomer}
            />
          )}
          {safePage === 'performance' && isAdmin && (
            <PerformancePage customers={customers} users={users} />
          )}
          {safePage === 'users' && isAdmin && (
            <UsersPage
              users={users}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeactivateUser={handleDeactivateUser}
            />
          )}
          {safePage === 'webhook' && (
            <WebhookPage onRefreshCustomers={loadCustomers} />
          )}
        </div>
      </div>
    </NotifProvider>
  );
}
