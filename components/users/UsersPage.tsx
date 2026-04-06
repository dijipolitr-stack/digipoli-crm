// components/users/UsersPage.tsx
'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { useNotif } from '@/lib/NotifContext';

interface User { id: string; name: string; email: string; phone: string | null; role: string; created_at?: string; active?: boolean; }
interface Props {
  users: User[];
  onCreateUser: (d: { name: string; email: string; phone: string; role: string }) => Promise<void>;
  onUpdateUser: (id: string, d: Partial<User>) => Promise<void>;
  onDeactivateUser: (id: string) => Promise<void>;
}

const emptyForm = { name: '', email: '', phone: '' };

export default function UsersPage({ users, onCreateUser, onUpdateUser, onDeactivateUser }: Props) {
  const notif = useNotif();
  const [showAdd,  setShowAdd]  = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const f = (k: string, v: string) => setForm(x => ({ ...x, [k]: v }));

  const openAdd  = () => { setForm(emptyForm); setErr(''); setShowAdd(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ name: u.name, email: u.email, phone: u.phone ?? '' }); setErr(''); };
  const closeAll = () => { setShowAdd(false); setEditUser(null); };

  const save = async () => {
    if (!form.name || !form.email) { setErr('Ad ve e-posta zorunludur.'); return; }
    setSaving(true); setErr('');
    try {
      if (editUser) {
        await onUpdateUser(editUser.id, { name: form.name, phone: form.phone });
        notif.add('Güncellendi', 'Kullanıcı bilgileri güncellendi');
      } else {
        await onCreateUser({ ...form, role: 'danışman' });
        notif.add('Eklendi', `${form.name} sisteme eklendi`);
      }
      closeAll();
    } catch (e: any) {
      setErr(e.message ?? 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (u: User) => {
    if (!confirm(`${u.name} kullanıcısını pasife al?`)) return;
    await onDeactivateUser(u.id);
    notif.add('Pasife Alındı', `${u.name} artık giriş yapamaz`);
  };

  const activeUsers = users.filter(u => u.active !== false);

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>Kullanıcı Yönetimi</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Admin dilediği kadar danışman ekleyebilir
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Yeni Kullanıcı</button>
      </div>

      <div className="users-grid">
        {activeUsers.map(u => (
          <div key={u.id} className="user-card-big">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar name={u.name} size={48} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.email}</div>
              </div>
              <span
                className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}
                style={{ marginLeft: 'auto' }}
              >
                {u.role === 'admin' ? 'Admin' : 'Danışman'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              <div>📱 {u.phone ?? '-'}</div>
              <div style={{ marginTop: 4 }}>📅 {u.created_at?.slice(0, 10)}</div>
            </div>
            {u.role !== 'admin' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(u)}>
                  Düzenle
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deactivate(u)}>
                  Pasife Al
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {(showAdd || editUser) && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeAll()}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div><div className="modal-title">{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</div></div>
              <button className="modal-close" onClick={closeAll}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon (905xx…)</label>
                  <input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="905xxxxxxxxx" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Gmail Adresi</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                  disabled={!!editUser}
                  placeholder="kullanici@gmail.com"
                />
                {editUser && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>E-posta değiştirilemez</div>}
              </div>
              {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAll}>İptal</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
