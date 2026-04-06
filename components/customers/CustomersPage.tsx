// components/customers/CustomersPage.tsx
'use client';

import { useState, useMemo } from 'react';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge, StekiBadge } from '@/components/ui/Badges';
import CustomerModal from './CustomerModal';
import AddCustomerModal from './AddCustomerModal';
import { STEKI_OPTIONS, DURUM_OPTIONS } from '@/lib/constants';
import { useNotif } from '@/lib/NotifContext';

interface Customer {
  id: string; musteri_id: string; ad_soyad: string;
  kanal: string | null; tarih: string | null; saat: string | null;
  steki: string | null; stegi_ozel: string | null;
  konusma_ozeti: string | null; durum: string;
  atanan_id: string | null; notlar: string | null;
  atanan?: { id: string; name: string } | null;
  mesajlar?: any[];
}
interface User { id: string; name: string; role: string; }
interface Props {
  customers: Customer[];
  user: { id: string; name: string; role: string };
  users: User[];
  onUpdateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  onAddCustomer: (data: Record<string, unknown>) => Promise<void>;
}

export default function CustomersPage({ customers, user, users, onUpdateCustomer, onAddCustomer }: Props) {
  const notif = useNotif();
  const [search,      setSearch]      = useState('');
  const [filterSteki, setFilterSteki] = useState('Tümü');
  const [filterDurum, setFilterDurum] = useState('Tümü');
  const [selected,    setSelected]    = useState<Customer | null>(null);
  const [showAdd,     setShowAdd]     = useState(false);

  const isAdmin = user.role === 'admin';

  const list = useMemo(() => {
    let d = isAdmin ? customers : customers.filter(c => c.atanan_id === user.id);
    if (search)       d = d.filter(c =>
      c.ad_soyad.toLowerCase().includes(search.toLowerCase()) ||
      c.musteri_id.includes(search)
    );
    if (filterSteki !== 'Tümü') d = d.filter(c => c.steki === filterSteki);
    if (filterDurum !== 'Tümü') d = d.filter(c => c.durum === filterDurum);
    return d;
  }, [customers, user, search, filterSteki, filterDurum, isAdmin]);

  const canEdit = (c: Customer) => isAdmin || c.atanan_id === user.id;

  const saveCustomer = async (id: string, data: Partial<Customer>) => {
    await onUpdateCustomer(id, data);
    // Update selected so modal reflects new state immediately
    if (selected?.id === id) setSelected(c => c ? { ...c, ...data } : c);
    notif.add('Kaydedildi', 'Müşteri bilgileri güncellendi');
  };

  const handleAdd = async (data: Record<string, unknown>) => {
    await onAddCustomer(data);
    notif.add('Eklendi', 'Yeni müşteri kaydedildi');
  };

  return (
    <div className="content">
      <div className="table-wrap">
        {/* Header + Filters */}
        <div className="table-header">
          <div>
            <div className="table-title">Müşteri Listesi</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{list.length} kayıt</div>
          </div>
          <div className="table-filters">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="İsim, WhatsApp..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterSteki} onChange={e => setFilterSteki(e.target.value)}>
              <option>Tümü</option>
              {STEKI_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterDurum} onChange={e => setFilterDurum(e.target.value)}>
              <option>Tümü</option>
              {DURUM_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ekle</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>KANAL</th>
                <th>TARİH / SAAT</th>
                <th>MÜŞTERİ ID</th>
                <th>AD SOYAD</th>
                <th>STEKİ</th>
                <th>DURUM</th>
                <th>DANIŞMAN</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">Kayıt bulunamadı</div>
                  </div>
                </td></tr>
              )}
              {list.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}>
                  <td><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{c.kanal}</span></td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>
                      {c.tarih}<br />
                      <span style={{ color: 'var(--muted)' }}>{c.saat}</span>
                    </span>
                  </td>
                  <td><span className="td-phone">{c.musteri_id}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={c.ad_soyad} size={28} />
                      <span className="td-name">{c.ad_soyad}</span>
                    </div>
                  </td>
                  <td>{c.steki ? <StekiBadge steki={c.steki} /> : '-'}</td>
                  <td><StatusBadge durum={c.durum} /></td>
                  <td><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{c.atanan?.name ?? '-'}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(c)}>Detay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selected && (
        <CustomerModal
          customer={selected}
          users={users}
          onClose={() => setSelected(null)}
          onSave={saveCustomer}
          canEdit={canEdit(selected)}
          currentUserId={user.id}
        />
      )}
      {showAdd && (
        <AddCustomerModal
          users={users}
          currentUserId={user.id}
          isAdmin={isAdmin}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
