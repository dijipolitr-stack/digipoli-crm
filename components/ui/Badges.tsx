// components/ui/Badges.tsx
'use client';

export function StatusBadge({ durum }: { durum: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    'Bilgiler Alındı': { cls: 'badge-green',  label: 'Bilgiler Alındı' },
    'İşlemde':         { cls: 'badge-blue',   label: 'İşlemde'         },
    'Teklif Verildi':  { cls: 'badge-amber',  label: 'Teklif Verildi'  },
    'Poliçe Kesildi':  { cls: 'badge-purple', label: 'Poliçe Kesildi'  },
    'Bekliyor':        { cls: 'badge-gray',   label: 'Bekliyor'        },
    'Takipte':         { cls: 'badge-blue',   label: 'Takipte'         },
    'Tamamlandı':      { cls: 'badge-green',  label: 'Tamamlandı'      },
    'İptal':           { cls: 'badge-red',    label: 'İptal'           },
  };
  const s = map[durum] ?? { cls: 'badge-gray', label: durum || '-' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function StekiBadge({ steki }: { steki: string }) {
  const colors: Record<string, string> = {
    Kasko: 'badge-blue', Trafik: 'badge-amber', DASK: 'badge-green',
    Sağlık: 'badge-purple', 'Ferdi Kaza': 'badge-gray',
    Hayat: 'badge-green', Konut: 'badge-amber', İşyeri: 'badge-blue',
  };
  return (
    <span className={`badge ${colors[steki] ?? 'badge-gray'}`} style={{ borderRadius: 6 }}>
      {steki || '-'}
    </span>
  );
}
