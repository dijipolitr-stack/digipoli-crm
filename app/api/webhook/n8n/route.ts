// ============================================================
// app/api/webhook/n8n/route.ts
// POST /api/webhook/n8n  — n8n'den müşteri verisi alır
// ============================================================
// n8n'de HTTP Request node ayarı:
//   Method: POST
//   URL: https://crm.digipoli.com/api/webhook/n8n
//   Header: x-webhook-secret: <WEBHOOK_SECRET env>
//   Body: JSON — sheet sütunlarını aşağıya map et

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { N8nWebhookPayload } from '@/types';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  // ── 1. Secret doğrulama ─────────────────────────────────
  const secret = req.headers.get('x-webhook-secret');
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Payload parse ────────────────────────────────────
  let payload: N8nWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { musteriId, adSoyad, kanal, tarih, saat, steki, stegiOzel, konusmaOzeti, durum } = payload;

  if (!musteriId || !adSoyad) {
    await logWebhook('error', payload, null, 'musteriId veya adSoyad eksik');
    return NextResponse.json({ error: 'musteriId ve adSoyad zorunludur.' }, { status: 400 });
  }

  // ── 3. Duplicate kontrolü ───────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id, musteri_id')
    .eq('musteri_id', musteriId)
    .maybeSingle();

  if (existing) {
    await logWebhook('duplicate', payload, musteriId, 'Zaten kayıtlı');
    return NextResponse.json({
      status: 'duplicate',
      message: `${musteriId} zaten kayıtlı.`,
      id: existing.id,
    });
  }

  // ── 4. Tarih normalize ─────────────────────────────────
  // n8n'den "15/01/2025" ya da "2025-01-15" gelebilir
  let normalizedTarih: string | null = null;
  if (tarih) {
    const parts = tarih.includes('/') ? tarih.split('/').reverse() : tarih.split('-');
    if (parts.length === 3) normalizedTarih = parts.join('-'); // YYYY-MM-DD
  }

  // ── 5. DB'ye ekle ──────────────────────────────────────
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .insert({
      musteri_id:    musteriId,
      ad_soyad:      adSoyad,
      kanal:         kanal ?? null,
      tarih:         normalizedTarih,
      saat:          saat ?? null,
      steki:         steki ?? null,
      stegi_ozel:    stegiOzel ?? null,
      konusma_ozeti: konusmaOzeti ?? null,
      durum:         normalizeDurum(durum),
    })
    .select()
    .single();

  if (error) {
    await logWebhook('error', payload, musteriId, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logWebhook('success', payload, musteriId, null);

  return NextResponse.json({
    status: 'created',
    id: customer.id,
    musteriId: customer.musteri_id,
  }, { status: 201 });
}

// ─── Helpers ──────────────────────────────────────────────

/** Sheet'ten gelen durum değerlerini normalize eder */
function normalizeDurum(raw?: string): string {
  if (!raw) return 'Bekliyor';
  const map: Record<string, string> = {
    'bekliyor':    'Bekliyor',
    'takipte':     'Takipte',
    'tamamlandı':  'Tamamlandı',
    'tamamlandi':  'Tamamlandı',
    'iptal':       'İptal',
  };
  return map[raw.toLowerCase()] ?? 'Bekliyor';
}

async function logWebhook(
  status: 'success' | 'error' | 'duplicate',
  payload: unknown,
  musteriId: string | null,
  errorMsg: string | null
) {
  await supabaseAdmin.from('webhook_logs').insert({
    source:     'n8n',
    status,
    payload,
    musteri_id: musteriId,
    error_msg:  errorMsg,
  });
}
