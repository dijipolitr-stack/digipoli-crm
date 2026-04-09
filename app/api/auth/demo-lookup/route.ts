import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ user: null, error: 'E-posta gerekli' }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, phone, role')
    .eq('email', email.toLowerCase().trim())
    .eq('active', true)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { user: null, error: 'Bu e-posta sisteme kayıtlı değil.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ user, error: null });
}