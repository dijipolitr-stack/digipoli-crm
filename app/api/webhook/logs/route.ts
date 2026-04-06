// ============================================================
// app/api/webhook/logs/route.ts
// GET /api/webhook/logs  — son webhook logları
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const limit = parseInt(new URL(req.url).searchParams.get('limit') ?? '20');

  const { data, error } = await supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
