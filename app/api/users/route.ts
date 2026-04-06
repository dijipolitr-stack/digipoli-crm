// ============================================================
// app/api/users/route.ts
// GET  /api/users  — kullanıcı listesi
// POST /api/users  — yeni kullanıcı ekle (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { CreateUserPayload } from '@/types';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, phone, role, color, active, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

