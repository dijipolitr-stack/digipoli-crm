// ============================================================
// app/api/customers/route.ts
// GET  /api/customers  — liste (filtrelenebilir)
// POST /api/customers  — yeni müşteri ekle
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateCustomerPayload } from '@/types';

// ─── GET ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const durum    = searchParams.get('durum');
  const atanan   = searchParams.get('atanan_id');
  const search   = searchParams.get('q');
  const page     = parseInt(searchParams.get('page') ?? '1');
  const limit    = parseInt(searchParams.get('limit') ?? '50');
  const offset   = (page - 1) * limit;

  let query = supabaseAdmin
    .from('customers')
    .select(`
      *,
      atanan:users!customers_atanan_id_fkey (
        id, name, role, color
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (durum)   query = query.eq('durum', durum);
  if (atanan)  query = query.eq('atanan_id', atanan);
  if (search)  query = query.or(
    `ad_soyad.ilike.%${search}%,musteri_id.ilike.%${search}%,steki.ilike.%${search}%`
  );

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /api/customers]', error);
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, error: null });
}

// ─── POST ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body: Record<string, any> = await req.json();

  if (!body.musteri_id || !body.ad_soyad) {
    return NextResponse.json(
      { data: null, error: 'musteriId ve adSoyad zorunludur.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      musteri_id:     body.musteri_id,
      ad_soyad:       body.ad_soyad,
      kanal:          body.kanal ?? null,
      tarih:          body.tarih ?? null,
      saat:           body.saat ?? null,
      steki:          body.steki ?? null,
      stegi_ozel:     body.stegi_ozel ?? null,
      konusma_ozeti:  body.konusma_ozeti ?? null,
      durum:          body.durum ?? 'Bekliyor',
      atanan_id:      body.atanan_id ?? null,
    })
    .select()
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500; // 23505 = unique violation
    return NextResponse.json({ data: null, error: error.message }, { status });
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}
