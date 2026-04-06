// components/customers/CustomerModal.tsx
'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge, StekiBadge } from '@/components/ui/Badges';
import { DURUM_OPTIONS } from '@/lib/constants';

interface Message { from: 'bot' | 'user'; text: string; time: string; }

interface Customer {
  id: string;
  musteri_id: string;
  ad_soyad: string;
  kanal: string | null;
  tarih: string | null;
  saat: string | null;
  steki: string | null;
  stegi_ozel: string | null;
  konusma_ozeti: string | null;
  durum: string;
  atanan_id: string | null;
  notlar: string | null;
  atanan?: { id: string; name: string } | null;
  mesajlar?: Message[];  // webhook'tan gelen WhatsApp geçmişi (opsiyonel)
}

interface User { id: string; name: string; role: string; }

interface Props {
  customer: Customer;
  users: User[];
  onClose: () => void;
  onSave: (id: string, data: Partial<Customer>) => Promise<void>;
  canEdit: boolean;
  currentUserId: string;
}

export default function CustomerModal({ customer: c, users, onClose, onSave, canEdit, currentUserId }: Props) {
  const [edit, setEdit]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData]   = useState({ ...c });
  const f = (k: keyof Customer, v: unknown) => setData(d => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    await onSave(c.id, {
      durum:         data.durum,
      atanan_id:     data.atanan_id,
      notlar:        data.notlar,
      stegi_ozel:    data.stegi_ozel,
      konusma_ozeti: data.konusma_ozeti,
      _activity: {
        type:    'note',
        content: `Durum: ${data.durum} · Danışman güncelledi`,
        user_id: currentUserId,
      },
    } as any);
    setSaving(false);
    setEdit(false);
  };

  const agents = users.filter(u => u.role === 'danışman' || u.role === 'user');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={c.ad_soyad} size={44} />
            <div>
              <div className="modal-title">{c.ad_soyad}</div>
              <div className="modal-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{c.musteri_id}</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                {c.steki && <StekiBadge steki={c.steki} />}
                <span style={{ color: 'var(--border)' }}>·</span>
                <StatusBadge durum={c.durum} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canEdit && !edit && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEdit(true)}>✏ Düzenle</button>
            )}
            {edit && (
              <>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                  {saving ? '...' : 'Kaydet'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setData({ ...c }); setEdit(false); }}>
                  İptal
                </button>
              </>
            )}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="detail-grid">
            {/* Sol: Temel Bilgiler */}
            <div className="detail-section">
              <div className="section-title">📋 Temel Bilgiler</div>
              <div className="detail-row">
                <span className="detail-label">Müşteri ID (WhatsApp)</span>
                <span className="detail-value">{c.musteri_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Kanal</span>
                <span className="detail-value">{c.kanal || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tarih / Saat</span>
                <span className="detail-value">{c.tarih} · {c.saat}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Durum</span>
                {edit ? (
                  <select
                    className="form-input"
                    value={data.durum}
                    onChange={e => f('durum', e.target.value)}
                    style={{ marginTop: 4 }}
                  >
                    {DURUM_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : <StatusBadge durum={c.durum} />}
              </div>
              <div className="detail-row">
                <span className="detail-label">Atanan Danışman</span>
                {edit && canEdit ? (
                  <select
                    className="form-input"
                    value={data.atanan_id ?? ''}
                    onChange={e => f('atanan_id', e.target.value || null)}
                    style={{ marginTop: 4 }}
                  >
                    <option value="">— Atanmamış —</option>
                    {agents.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                ) : (
                  <span className="detail-value">{c.atanan?.name ?? '-'}</span>
                )}
              </div>
            </div>

            {/* Sağ: Sigorta Bilgileri */}
            <div className="detail-section">
              <div className="section-title">🛡 Sigorta Bilgileri</div>
              <div className="detail-row">
                <span className="detail-label">Sigorta Türü (STEKİ)</span>
                {c.steki ? <StekiBadge steki={c.steki} /> : <span className="detail-value">-</span>}
              </div>
              <div className="detail-row">
                <span className="detail-label">Ürüne Özel Bilgiler (STEĞİ)</span>
                {edit ? (
                  <textarea
                    className="form-input"
                    value={data.stegi_ozel ?? ''}
                    onChange={e => f('stegi_ozel', e.target.value)}
                    rows={4}
                    style={{ marginTop: 4, resize: 'vertical' }}
                  />
                ) : (
                  <span className="detail-value" style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {c.stegi_ozel || '-'}
                  </span>
                )}
              </div>
            </div>

            {/* Full width: Konuşma Özeti */}
            <div className="detail-section detail-full">
              <div className="section-title">📝 Konuşma Özeti</div>
              {edit ? (
                <textarea
                  className="form-input"
                  value={data.konusma_ozeti ?? ''}
                  onChange={e => f('konusma_ozeti', e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              ) : (
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted2)' }}>
                  {c.konusma_ozeti || '-'}
                </p>
              )}
            </div>

            {/* Full width: Notlar */}
            {(edit || c.notlar) && (
              <div className="detail-section detail-full">
                <div className="section-title">🗒 Danışman Notu</div>
                {edit ? (
                  <textarea
                    className="form-input"
                    value={data.notlar ?? ''}
                    onChange={e => f('notlar', e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical' }}
                    placeholder="Özel not ekle..."
                  />
                ) : (
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted2)' }}>{c.notlar}</p>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Konuşması */}
          {c.mesajlar && c.mesajlar.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💬</span> WhatsApp Konuşması
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>({c.mesajlar.length} mesaj)</span>
              </div>
              <div className="chat-wrap">
                {c.mesajlar.map((m, i) => (
                  <div key={i} className={`msg-wrap-${m.from}`}>
                    <div className={`msg msg-${m.from}`}>
                      {m.from === 'bot' && (
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>🤖 BOT</div>
                      )}
                      {m.text}
                    </div>
                    <div className="msg-time">{m.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
