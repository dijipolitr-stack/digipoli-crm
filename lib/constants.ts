// lib/constants.ts — Uygulama genelinde sabitler

export const STEKI_OPTIONS = [
  'Kasko', 'Trafik', 'DASK', 'Sağlık', 'Konut',
  'İşyeri', 'Ferdi Kaza', 'Hayat', 'Diğer',
] as const;

export const KANAL_OPTIONS = [
  'WhatsApp', 'Telefon', 'Web', 'Referans', 'Sosyal Medya',
] as const;

export const DURUM_OPTIONS = [
  'Bilgiler Alındı', 'İşlemde', 'Teklif Verildi', 'Poliçe Kesildi', 'İptal',
] as const;

/** HTML durum → DB durum mapping (backward compat) */
export const DURUM_LABEL_MAP: Record<string, string> = {
  'Bilgiler Alındı': 'Tamamlandı',
  'Poliçe Kesildi':  'Tamamlandı',
  'İşlemde':         'Takipte',
  'Teklif Verildi':  'Takipte',
  'İptal':           'İptal',
  'Bekliyor':        'Bilgiler Alındı',
};

export type StekiOption = typeof STEKI_OPTIONS[number];
export type KanalOption = typeof KANAL_OPTIONS[number];
export type DurumOption = typeof DURUM_OPTIONS[number];
