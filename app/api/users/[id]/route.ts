// ============================================================
// app/api/users/[id]/route.ts
// PATCH  /api/users/:id  — bilgileri güncelle
// DELETE /api/users/:id  — pasife al (active = false)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json();

  // role, name, phone, color, active güncellenebilir
  const allowed = ['name', 'phone', 'role', 'color', 'active'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  // Hard delete yerine pasife al
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ active: false })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
