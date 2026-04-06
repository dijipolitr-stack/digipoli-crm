// components/customers/AddCustomerModal.tsx
'use client';

import { useState } from 'react';
import { STEKI_OPTIONS, KANAL_OPTIONS, DURUM_OPTIONS } from '@/lib/constants';

interface User { id: string; name: string; role: string; }
interface Props {
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function AddCustomerModal({ users, currentUserId, isAdmin, onClose, onAdd }: Props) {
  const agents = users.filter(u => u.role === 'danışman' || u.role === 'user');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [d, setD] = useState({
    kanal:         'WhatsApp',
    tarih:         today(),
    saat:          nowTime(),
    musteri_id:    '',
    ad_soyad:      '',
    steki:         'Kasko',
    stegi_ozel:    '',
    konusma_ozeti: '',
    durum:         'Bilgiler Alındı',
    atanan_id:     agents[0]?.id ?? '',
  });

  const f = (k: string, v: string) => setD(x => ({ ...x, [k]: v }));

  const save = async () => {
    if (!d.musteri_id.trim() || !d.ad_soyad.trim()) {
      setErr('Müşteri ID ve Ad Soyad zorunludur.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onAdd({ ...d, atanan_id: d.atanan_id || null });
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Yeni Müşteri Ekle</div>
            <div className="modal-subtitle">Manuel kayıt</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kanal</label>
              <select className="form-input" value={d.kanal} onChange={e => f('kanal', e.target.value)}>
                {KANAL_OPTIONS.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tarih</label>
              <input className="form-input" type="date" value={d.tarih} onChange={e => f('tarih', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Müşteri ID (WhatsApp No)</label>
              <input className="form-input" value={d.musteri_id} onChange={e => f('musteri_id', e.target.value)} placeholder="905xxxxxxxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">Ad Soyad</label>
              <input className="form-input" value={d.ad_soyad} onChange={e => f('ad_soyad', e.target.value)} placeholder="Ad Soyad" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sigorta Türü (STEKİ)</label>
              <select className="form-input" value={d.steki} onChange={e => f('steki', e.target.value)}>
                {STEKI_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Danışman</label>
                <select className="form-input" value={d.atanan_id} onChange={e => f('atanan_id', e.target.value)}>
                  <option value="">— Atanmamış —</option>
                  {agents.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Ürüne Özel Bilgiler (STEĞİ)</label>
            <textarea className="form-input" value={d.stegi_ozel} onChange={e => f('stegi_ozel', e.target.value)} rows={3} placeholder="Araç bilgileri, adres, kişisel detaylar..." />
          </div>
          <div className="form-group">
            <label className="form-label">Konuşma Özeti</label>
            <textarea className="form-input" value={d.konusma_ozeti} onChange={e => f('konusma_ozeti', e.target.value)} rows={2} />
          </div>
          {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{err}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
