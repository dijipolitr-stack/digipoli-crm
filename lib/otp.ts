// lib/otp.ts
// OTP saklama: Redis varsa Redis, yoksa Supabase one_time_tokens tablosu
// ─────────────────────────────────────────────────────────────────────
// Gerekli:  npm install redis axios
//           Env: REDIS_URL, NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER

import axios from 'axios';

const OTP_TTL = 300; // 5 dakika (saniye)

// ── Redis client (opsiyonel) ──────────────────────────────
let redisClient: any = null;

async function getRedis() {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (e: Error) => console.error('[Redis]', e.message));
    await redisClient.connect();
    return redisClient;
  } catch {
    return null;
  }
}

// ── OTP Kaydet ────────────────────────────────────────────
export async function saveOTP(userId: string, otp: string): Promise<void> {
  const redis = await getRedis();

  if (redis) {
    await redis.setEx(`otp:${userId}`, OTP_TTL, otp);
    return;
  }

  // Fallback: Supabase otp_codes tablosu
  // Tablo: CREATE TABLE otp_codes (user_id UUID PRIMARY KEY, code TEXT, expires_at TIMESTAMPTZ);
  const { supabaseAdmin } = await import('./supabase');
  const expiresAt = new Date(Date.now() + OTP_TTL * 1000).toISOString();
  await supabaseAdmin
    .from('otp_codes')
    .upsert({ user_id: userId, code: otp, expires_at: expiresAt });
}

// ── OTP Doğrula + Sil ────────────────────────────────────
export async function verifyOTP(userId: string, otp: string): Promise<boolean> {
  const redis = await getRedis();

  if (redis) {
    const saved = await redis.get(`otp:${userId}`);
    if (!saved || saved !== otp) return false;
    await redis.del(`otp:${userId}`);
    return true;
  }

  // Fallback: Supabase
  const { supabaseAdmin } = await import('./supabase');
  const { data } = await supabaseAdmin
    .from('otp_codes')
    .select('code, expires_at')
    .eq('user_id', userId)
    .single();

  if (!data) return false;
  if (new Date(data.expires_at) < new Date()) return false;
  if (data.code !== otp) return false;

  await supabaseAdmin.from('otp_codes').delete().eq('user_id', userId);
  return true;
}

// ── Netgsm SMS Gönder ────────────────────────────────────
export async function sendOTP(phone: string, otp: string): Promise<void> {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const header   = process.env.NETGSM_HEADER ?? 'DIGIPOLI';

  if (!usercode || !password) {
    // Dev modda SMS göndermek yerine sadece logla
    console.log(`[DEV] SMS → ${phone}: ${otp}`);
    return;
  }

  const msg    = `Digipoli CRM giris kodunuz: ${otp} (5 dakika gecerlidir)`;
  const params = new URLSearchParams({
    usercode, password,
    gsmno:    phone,
    message:  msg,
    msgheader: header,
    dil:      'TR',
    filter:   '0',
  });

  const response = await axios.get(
    `https://api.netgsm.com.tr/sms/send/get/?${params}`
  );

  const code = String(response.data).trim().split(' ')[0];
  // Netgsm başarı kodları: 00, 01, 02
  if (!['00', '01', '02'].includes(code)) {
    throw new Error(`Netgsm hata kodu: ${code}`);
  }
}
