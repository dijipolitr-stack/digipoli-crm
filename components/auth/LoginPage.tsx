// components/auth/LoginPage.tsx — Gerçek Google OAuth + SMS OTP
// ─────────────────────────────────────────────────────────────
// Gerekli paket:  npm install @react-oauth/google
// Env:            NEXT_PUBLIC_GOOGLE_CLIENT_ID

'use client';

import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface User { id: string; name: string; email: string; phone: string | null; role: string; }
interface Props { onLogin: (u: User) => void; }

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function LoginPage({ onLogin }: Props) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginInner onLogin={onLogin} />
    </GoogleOAuthProvider>
  );
}

// ── İç bileşen ────────────────────────────────────────────
function LoginInner({ onLogin }: Props) {
  const [step,      setStep]      = useState<'google' | 'otp'>('google');
  const [userId,    setUserId]    = useState('');
  const [phoneMask, setPhoneMask] = useState('');
  const [otp,       setOtp]       = useState('');
  const [err,       setErr]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [credential, setCredential] = useState(''); // Google credential (yeniden gönderim için)

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Adım 1: Google token → backend ────────────────────
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setErr('');
    setCredential(credentialResponse.credential);

    try {
      const res  = await fetch('/api/auth/google', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error ?? 'Giriş başarısız.');
        return;
      }

      setUserId(data.userId);
      setPhoneMask(data.phoneMask);
      setStep('otp');
      setCountdown(60);
    } catch {
      setErr('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ── Adım 2: OTP doğrulama ─────────────────────────────
  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    setErr('');

    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error ?? 'Hatalı kod.');
        return;
      }

      onLogin(data.user);
    } catch {
      setErr('Doğrulama başarısız. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ── Kodu yeniden gönder ───────────────────────────────
  const resend = async () => {
    if (!credential) return;
    setOtp('');
    setErr('');
    setLoading(true);

    try {
      const res  = await fetch('/api/auth/google', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (res.ok) setCountdown(60);
      else setErr(data.error ?? 'SMS gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-bg" />
      {[400, 600, 800].map(s => (
        <div key={s} style={{
          position: 'absolute', width: s, height: s, borderRadius: '50%',
          border: `1px solid rgba(79,142,247,${s === 400 ? 0.06 : 0.03})`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }} />
      ))}

      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg,#4f8ef7,#7c5cfc)',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 28px rgba(79,142,247,0.3)',
          }}>🛡</div>
          <h1 style={{ fontSize: 23, letterSpacing: -0.5, fontWeight: 800 }}>Digipoli CRM</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5 }}>Sigorta Yönetim Paneli</p>
        </div>

        {/* ── ADIM 1: Google ── */}
        {step === 'google' && (
          <>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 24,
              fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔐</span>
              <span>Sisteme giriş <strong style={{ color: 'var(--muted2)' }}>Google hesabınızla</strong> yapılır.
                Hesabınız yönetici tarafından kayıtlı olmalıdır.</span>
            </div>

            {err && <ErrorBox msg={err} />}

            {/* Google Login Butonu */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {loading
                ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', background: '#fff', borderRadius: 10, border: '1px solid #dadce0', fontSize: 14, color: '#3c4043' }}>
                    <span className="loading-spinner" style={{ borderColor: '#dadce0', borderTopColor: '#4285F4', width: 16, height: 16 }} />
                    Doğrulanıyor...
                  </div>
                )
                : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErr('Google girişi başarısız. Tekrar deneyin.')}
                    text="signin_with"
                    theme="outline"
                    shape="rectangular"
                    size="large"
                  />
                )
              }
            </div>

            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.8 }}>
              Erişim sorunu? Yöneticinizle iletişime geçin.
            </div>
          </>
        )}

        {/* ── ADIM 2: OTP ── */}
        {step === 'otp' && (
          <>
            <div style={{
              background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              fontSize: 13, color: 'var(--muted2)', textAlign: 'center', lineHeight: 1.8,
            }}>
              📱 <strong style={{ color: 'var(--text)' }}>****{phoneMask}</strong> numaralı telefona<br />
              6 haneli doğrulama kodu gönderildi.
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                Doğrulama Kodu
              </label>
              <input
                className="form-input"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerify()}
                placeholder="_ _ _ _ _ _"
                autoFocus
                style={{ textAlign: 'center', fontSize: 28, letterSpacing: 10, fontFamily: 'monospace', padding: '14px' }}
                maxLength={6}
              />
            </div>

            {err && <ErrorBox msg={err} />}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
              onClick={handleVerify}
              disabled={otp.length < 6 || loading}
            >
              {loading
                ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Doğrulanıyor...</>
                : '✓ Doğrula ve Giriş Yap'
              }
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12 }}>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}
                onClick={() => { setStep('google'); setErr(''); setOtp(''); }}
              >
                ← Geri
              </button>
              {countdown > 0
                ? <span style={{ color: 'var(--muted)' }}>Yeniden gönder ({countdown}s)</span>
                : (
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
                    onClick={resend}
                    disabled={loading}
                  >
                    Kodu Yeniden Gönder
                  </button>
                )
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, textAlign: 'center', lineHeight: 1.6 }}>
      {msg}
    </div>
  );
}
