// ============================================================
// app/api/customers/[id]/route.ts
// GET    /api/customers/:id  — tek müşteri + aktiviteler
// PATCH  /api/customers/:id  — güncelle (durum, atanan, notlar…)
// DELETE /api/customers/:id  — sil
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { UpdateCustomerPayload } from '@/types';

type Ctx = { params: { id: string } };

// ─── GET ──────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = params;

  const [customerRes, activitiesRes] = await Promise.all([
    supabaseAdmin
      .from('customers')
      .select(`*, atanan:users!customers_atanan_id_fkey(id,name,role,color)`)
      .eq('id', id)
      .single(),

    supabaseAdmin
      .from('customer_activities')
      .select(`*, user:users(id,name,color)`)
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (customerRes.error) {
    const status = customerRes.error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ data: null, error: customerRes.error.message }, { status });
  }

  return NextResponse.json({
    data: {
      customer:   customerRes.data,
      activities: activitiesRes.data ?? [],
    },
    error: null,
  });
}

// ─── PATCH ────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = params;
  const body: UpdateCustomerPayload & { _activity?: { type: string; content: string; user_id: string } }
    = await req.json();

  // Aktivite logu ayrı alınıyor, müşteri kaydına dokunmaz
  const { _activity, ...customerFields } = body;

  // Müşteri güncelle
  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(customerFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // İsteğe bağlı aktivite kaydı
  if (_activity) {
    await supabaseAdmin.from('customer_activities').insert({
      customer_id: id,
      user_id:     _activity.user_id ?? null,
      type:        _activity.type,
      content:     _activity.content,
    });
  }

  return NextResponse.json({ data, error: null });
}

// ─── DELETE ───────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = params;

  const { error } = await supabaseAdmin
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true }, error: null });
}
