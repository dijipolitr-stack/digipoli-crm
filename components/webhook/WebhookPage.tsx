// components/webhook/WebhookPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useNotif } from '@/lib/NotifContext';

interface WebhookLog { id: string; status: string; musteri_id: string | null; created_at: string; payload?: any; }
interface Props { onRefreshCustomers: () => void; }

const ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/webhook/n8n`;

const DEMO_JSON = `{
  "kanal": "WhatsApp",
  "tarih": "${new Date().toISOString().slice(0, 10)}",
  "saat": "${new Date().toTimeString().slice(0, 5)}",
  "musteriId": "905312345678",
  "adSoyad": "Test Kullanıcı",
  "steki": "Kasko",
  "stegiOzel": "Araç: Mercedes C180 2022 | Plaka: 34TEST99",
  "konusmaOzeti": "Kasko sigortası için bilgi istedi.",
  "durum": "Bilgiler Alındı"
}`;

export default function WebhookPage({ onRefreshCustomers }: Props) {
  const notif = useNotif();
  const [json,    setJson]    = useState(DEMO_JSON);
  const [logs,    setLogs]    = useState<WebhookLog[]>([]);
  const [sending, setSending] = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    fetch('/api/webhook/logs?limit=15')
      .then(r => r.json())
      .then(d => setLogs(d.data ?? []));
  }, []);

  const simulate = async () => {
    let payload: any;
    try { payload = JSON.parse(json); }
    catch { notif.add('JSON Hatası', 'Geçersiz JSON formatı'); return; }

    setSending(true);
    try {
      const res  = await fetch('/api/webhook/n8n', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.status !== 'error') {
        notif.add('Webhook Alındı', `${payload.adSoyad} – ${payload.steki}`);
        onRefreshCustomers();
      } else {
        notif.add('Hata', data.error ?? data.message ?? 'Bilinmeyen hata');
      }

      // Reload logs
      const logsRes = await fetch('/api/webhook/logs?limit=15');
      const logsData = await logsRes.json();
      setLogs(logsData.data ?? []);
    } catch (e: any) {
      notif.add('Hata', e.message);
    } finally {
      setSending(false);
    }
  };

  const copyEndpoint = () => {
    navigator.clipboard.writeText(ENDPOINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Sol: Endpoint + Alan Eşleştirme */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="webhook-dot" />
              <h3 style={{ fontSize: 14 }}>Webhook Endpoint</h3>
            </div>
            <div
              style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', marginBottom: 12, wordBreak: 'break-all' }}
            >
              {ENDPOINT}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={copyEndpoint}>
              {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, marginTop: 16 }}>
              <div><strong style={{ color: 'var(--muted2)' }}>Yöntem:</strong> POST</div>
              <div><strong style={{ color: 'var(--muted2)' }}>Content-Type:</strong> application/json</div>
              <div><strong style={{ color: 'var(--muted2)' }}>Header:</strong> x-webhook-secret: &lt;.env değeri&gt;</div>
              <div style={{ marginTop: 12, padding: 10, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ color: 'var(--muted2)', marginBottom: 8, fontWeight: 600 }}>n8n HTTP Request node:</div>
                <div>• Method: POST</div>
                <div>• Body Content Type: JSON</div>
                <div>• Headers → x-webhook-secret ekle</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Alan Eşleştirme</h3>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--muted)', paddingBottom: 8 }}>Sheet Sütunu</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>Webhook Alanı</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['MÜŞTERİ ID', 'musteriId'],
                  ['AD SOYADİ',  'adSoyad'],
                  ['KANAL',      'kanal'],
                  ['TARİH',      'tarih'],
                  ['SAAT',       'saat'],
                  ['STEKİ',      'steki'],
                  ['STEĞİ ÖZEL', 'stegiOzel'],
                  ['KONUŞMA ÖZETİ', 'konusmaOzeti'],
                  ['DURUM',      'durum'],
                ].map(([s, w]) => (
                  <tr key={s}>
                    <td style={{ padding: '5px 0', fontSize: 12, color: 'var(--amber)', fontFamily: 'monospace' }}>{s}</td>
                    <td style={{ padding: '5px 0', fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace' }}>{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ: Test + Loglar */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Gerçek Webhook Testi</h3>
            <textarea
              value={json}
              onChange={e => setJson(e.target.value)}
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12, height: 280, resize: 'vertical' }}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              onClick={simulate}
              disabled={sending}
            >
              {sending ? '⏳ Gönderiliyor...' : '▶ Gönder → Supabase\'e Kaydet'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
              Bu test gerçek bir webhook POST isteği gönderir
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Son Webhook Logları</h3>
            {logs.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Henüz log yok</div>}
            {logs.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--muted)', minWidth: 80, fontSize: 11 }}>
                  {new Date(l.created_at).toLocaleTimeString('tr')}
                </span>
                <span className={`badge ${l.status === 'success' ? 'badge-green' : l.status === 'duplicate' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 10 }}>
                  {l.status}
                </span>
                <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: 11 }}>
                  {l.musteri_id ?? '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
