// components/export/ExportButton.tsx
// Müşteri listesi, performans tablosu ve webhook logları için
// Excel + PDF indirme dropdown'u
'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  ExportCustomer, ExportPerformance, ExportWebhookLog,
} from '@/lib/export';

// ── Prop Types ────────────────────────────────────────────
type CustomerExportProps = {
  type: 'customers';
  data: ExportCustomer[];
  filename?: string;
};
type PerformanceExportProps = {
  type: 'performance';
  data: ExportPerformance[];
  filename?: string;
};
type WebhookExportProps = {
  type: 'webhook';
  data: ExportWebhookLog[];
  filename?: string;
};

type Props = CustomerExportProps | PerformanceExportProps | WebhookExportProps;

// ── Bileşen ───────────────────────────────────────────────
export default function ExportButton(props: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleExcel = async () => {
    setLoading('excel');
    setOpen(false);
    try {
      const { exportCustomersExcel, exportPerformanceExcel, exportWebhookLogsExcel } = await import('@/lib/export');
      if (props.type === 'customers')   await exportCustomersExcel(props.data, props.filename);
      if (props.type === 'performance') await exportPerformanceExcel(props.data, props.filename);
      if (props.type === 'webhook')     await exportWebhookLogsExcel(props.data, props.filename);
    } catch (e) {
      console.error('Excel export hatası:', e);
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    if (props.type === 'webhook') return; // webhook için PDF yok
    setLoading('pdf');
    setOpen(false);
    try {
      const { exportCustomersPDF, exportPerformancePDF } = await import('@/lib/export');
      if (props.type === 'customers')   await exportCustomersPDF(props.data, props.filename);
      if (props.type === 'performance') await exportPerformancePDF(props.data, props.filename);
    } catch (e) {
      console.error('PDF export hatası:', e);
    } finally {
      setLoading(null);
    }
  };

  const hasPDF = props.type !== 'webhook';
  const count  = props.data.length;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Ana buton */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(o => !o)}
        disabled={loading !== null || count === 0}
        style={{ gap: 6 }}
      >
        {loading
          ? <><span className="loading-spinner" style={{ width: 13, height: 13 }} /> İndiriliyor...</>
          : <>⬇ Dışa Aktar <span style={{ opacity: 0.5, fontSize: 10 }}>({count})</span></>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 12, padding: 6, minWidth: 180,
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Excel */}
          <button
            onClick={handleExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontSize: 13, textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <div>
              <div style={{ fontWeight: 500 }}>Excel İndir</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>.xlsx dosyası</div>
            </div>
          </button>

          {/* PDF */}
          {hasPDF && (
            <button
              onClick={handlePDF}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text)', fontSize: 13, textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontWeight: 500 }}>PDF İndir</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tablo formatında</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
