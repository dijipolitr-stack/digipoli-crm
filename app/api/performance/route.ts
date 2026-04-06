// ============================================================
// app/api/performance/route.ts
// GET /api/performance  — dashboard stats + danışman performansı
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { DashboardStats, ConsultantPerformance } from '@/types';

export async function GET() {
  // Tüm müşterileri ve kullanıcıları tek sorguda çek
  const [customersRes, usersRes] = await Promise.all([
    supabaseAdmin
      .from('customers')
      .select('id, durum, atanan_id, created_at'),
    supabaseAdmin
      .from('users')
      .select('id, name, role, color, active')
      .eq('active', true),
  ]);

  if (customersRes.error || usersRes.error) {
    return NextResponse.json(
      { data: null, error: customersRes.error?.message ?? usersRes.error?.message },
      { status: 500 }
    );
  }

  const customers = customersRes.data ?? [];
  const users     = usersRes.data ?? [];
  const today     = new Date().toISOString().slice(0, 10);

  // ── Dashboard istatistikleri ────────────────────────────
  const stats: DashboardStats = {
    totalCustomers: customers.length,
    bekliyor:       customers.filter(c => c.durum === 'Bekliyor').length,
    takipte:        customers.filter(c => c.durum === 'Takipte').length,
    tamamlandi:     customers.filter(c => c.durum === 'Tamamlandı').length,
    iptal:          customers.filter(c => c.durum === 'İptal').length,
    todayNew:       customers.filter(c => c.created_at?.startsWith(today)).length,
    conversionRate: customers.length
      ? Math.round(
          (customers.filter(c => c.durum === 'Tamamlandı').length / customers.length) * 100
        )
      : 0,
  };

  // ── Danışman performansı ────────────────────────────────
  const consultants = users.filter(u => u.role === 'danışman');

  const performance: ConsultantPerformance[] = consultants.map(user => {
    const mine = customers.filter(c => c.atanan_id === user.id);
    const tamamlandi = mine.filter(c => c.durum === 'Tamamlandı').length;
    return {
      user: user as any,
      total:          mine.length,
      tamamlandi,
      takipte:        mine.filter(c => c.durum === 'Takipte').length,
      bekliyor:       mine.filter(c => c.durum === 'Bekliyor').length,
      conversionRate: mine.length ? Math.round((tamamlandi / mine.length) * 100) : 0,
    };
  });

  return NextResponse.json({ data: { stats, performance }, error: null });
}
