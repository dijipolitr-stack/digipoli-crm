// components/dashboard/DashboardPage.tsx
'use client';

import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badges';
import { STEKI_OPTIONS } from '@/lib/constants';

interface Customer {
  id: string; ad_soyad: string; steki: string | null;
  tarih: string | null; durum: string; atanan_id: string | null;
  konusma_ozeti: string | null;
}
interface User { id: string; name: string; role: string; }
interface Props {
  customers: Customer[];
  user: { id: string; name: string; role: string };
  users: User[];
  setPage: (p: string) => void;
}

export default function DashboardPage({ customers, user, users, setPage }: Props) {
  const isAdmin = user.role === 'admin';
  const mine = isAdmin ? customers : customers.filter(c => c.atanan_id === user.id);

  // Sigorta türü dağılımı
  const byType = STEKI_OPTIONS
    .map(t => ({ type: t, count: mine.filter(c => c.steki === t).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Son başvurular
  const recent = [...mine]
    .sort((a, b) => (b.id > a.id ? 1 : -1))
    .slice(0, 5);

  const tamamlandi = mine.filter(c => c.durum === 'Tamamlandı' || c.durum === 'Poliçe Kesildi' || c.durum === 'Bilgiler Alındı').length;
  const konusmaSayisi = mine.reduce((a, c) => a + ((c as any).mesajlar?.length ?? 0), 0);

  return (
    <div className="content">
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#4f8ef7' }} />
          <div className="stat-icon">👥</div>
          <div className="stat-label">{isAdmin ? 'Toplam Müşteri' : 'Müşterilerim'}</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{mine.length}</div>
          <div className="stat-sub">Kayıtlı müşteri</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#22c55e' }} />
          <div className="stat-icon">✅</div>
          <div className="stat-label">Bilgiler Alındı</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{tamamlandi}</div>
          <div className="stat-sub">Tamamlanan form</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#7c5cfc' }} />
          <div className="stat-icon">💬</div>
          <div className="stat-label">Toplam Konuşma</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{konusmaSayisi}</div>
          <div className="stat-sub">WhatsApp mesajı</div>
        </div>

        {isAdmin && (
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#f59e0b' }} />
            <div className="stat-icon">👤</div>
            <div className="stat-label">Aktif Danışman</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>
              {users.filter(u => u.role === 'danışman' || u.role === 'user').length}
            </div>
            <div className="stat-sub">Kayıtlı kullanıcı</div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sigorta Türleri */}
        <div className="card">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14 }}>Sigorta Türlerine Göre</h3>
          </div>
          {byType.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Veri yok</div>
            : byType.map(({ type, count }) => (
              <div key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>{type}</span>
                  <span style={{ color: 'var(--muted2)' }}>{count}</span>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / mine.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#4f8ef7,#7c5cfc)',
                    borderRadius: 4,
                    transition: 'width .5s',
                  }} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Son Başvurular */}
        <div className="card">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14 }}>Son Başvurular</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage('customers')}>Tümü →</button>
          </div>
          {recent.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={c.ad_soyad} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{c.ad_soyad}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.steki} · {c.tarih}</div>
              </div>
              <StatusBadge durum={c.durum} />
            </div>
          ))}
          {recent.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz müşteri yok</div>}
        </div>
      </div>
    </div>
  );
}
