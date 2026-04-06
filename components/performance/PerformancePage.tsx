// components/performance/PerformancePage.tsx
'use client';

import Avatar from '@/components/ui/Avatar';
import { STEKI_OPTIONS } from '@/lib/constants';

interface Customer { id: string; steki: string | null; durum: string; atanan_id: string | null; }
interface User { id: string; name: string; role: string; }
interface Props { customers: Customer[]; users: User[]; }

export default function PerformancePage({ customers, users }: Props) {
  const agents = users.filter(u => u.role === 'danışman' || u.role === 'user');

  const stats = agents.map(a => {
    const mine = customers.filter(c => c.atanan_id === a.id);
    return {
      ...a,
      total:     mine.length,
      completed: mine.filter(c =>
        c.durum === 'Bilgiler Alındı' || c.durum === 'Poliçe Kesildi' || c.durum === 'Tamamlandı'
      ).length,
      kasko:  mine.filter(c => c.steki === 'Kasko').length,
      saglik: mine.filter(c => c.steki === 'Sağlık').length,
      dask:   mine.filter(c => c.steki === 'DASK').length,
      trafik: mine.filter(c => c.steki === 'Trafik').length,
    };
  });

  const maxTotal = Math.max(...stats.map(s => s.total), 1);

  const byType = STEKI_OPTIONS
    .map(t => ({ type: t, count: customers.filter(c => c.steki === t).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Danışman Performansı */}
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 20 }}>Danışman Performansı</h3>
          {stats.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Danışman yok</div>
            : stats.map(a => (
              <div key={a.id} className="perf-row">
                <Avatar name={a.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.total} müşteri</span>
                  </div>
                  <div className="perf-bar-bg">
                    <div
                      className="perf-bar-fill"
                      style={{
                        width: `${(a.total / maxTotal) * 100}%`,
                        background: 'linear-gradient(90deg,#4f8ef7,#7c5cfc)',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--green)', minWidth: 60, textAlign: 'right' }}>
                  {a.completed} ✓
                </div>
              </div>
            ))
          }
        </div>

        {/* Sigorta Türü Dağılımı */}
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 20 }}>Sigorta Türü Dağılımı</h3>
          {customers.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Veri yok</div>
            : byType.map(({ type, count }) => (
              <div key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>{type}</span>
                  <span style={{ color: 'var(--muted2)' }}>
                    {count} ({Math.round((count / customers.length) * 100)}%)
                  </span>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / customers.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#06b6d4,#4f8ef7)',
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Detay Tablosu */}
      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">Danışman Detay Tablosu</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Danışman</th><th>Toplam</th>
              <th>Kasko</th><th>Sağlık</th><th>DASK</th><th>Trafik</th>
              <th>Tamamlanan</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(a => (
              <tr key={a.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name} size={28} />
                    <span style={{ fontWeight: 500 }}>{a.name}</span>
                  </div>
                </td>
                <td><strong style={{ color: 'var(--accent)' }}>{a.total}</strong></td>
                <td>{a.kasko}</td>
                <td>{a.saglik}</td>
                <td>{a.dask}</td>
                <td>{a.trafik}</td>
                <td><span className="badge badge-green">{a.completed}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
