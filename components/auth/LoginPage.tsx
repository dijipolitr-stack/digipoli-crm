// components/auth/LoginPage.tsx
// Google OAuth YOK — sadece e-posta ile giriş
'use client';

import { useState, useEffect } from 'react';

interface User { id: string; name: string; email: string; phone: string | null; role: string; }
interface Props { onLogin: (u: User) => void; }

export default function LoginPage({ onLogin }: Props) {
  const [email,     setEmail]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [sentOtp,   setSentOtp]   = useState('');
  const [step,      setStep]      = useState<'email' | 'otp'>('email');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [err,       setErr]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleEmailSubmit = async () => {
    if (!email.trim()) { setErr('E-posta adresi girin.'); return; }
    setLoading(true);
    setErr('');
    try {
      const res  = await fetch('/api/auth/demo-lookup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setErr(data.error ?? 'Bu e-posta sisteme kayıtlı değil.');
        return;
      }
      setFoundUser(data.user);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setSentOtp(code);
      setStep('otp');
      setCountdown(60);
    } catch {
      setErr('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = () => {
    if (otp === sentOtp && foundUser) {
      onLogin(foundUser);
    } else {
      setErr('Hatalı kod. Tekrar deneyin.');
    }
  };

  const resend = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setCountdown(60);
    setErr('');
    setOtp('');
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

        {step === 'email' && (
          <>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔐</span>
              <span>Sisteme kayıtlı <strong style={{ color: 'var(--muted2)' }}>e-posta adresinizle</strong> giriş yapın.</span>
            </div>

            <div className="form-group">
              <label className="form-label">E-Posta Adresi</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                placeholder="ornek@email.com"
                autoFocus
              />
            </div>

            {err && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, textAlign: 'center' }}>{err}</div>}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
              onClick={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? 'Kontrol ediliyor...' : 'Devam Et →'}
            </button>
          </>
        )}

        {step === 'otp' && foundUser && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{foundUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{foundUser.email}</div>
            </div>

            <div style={{
              background: 'var(--bg3)', border: '1px dashed var(--border2)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16,
              fontSize: 12, color: 'var(--muted)', textAlign: 'center',
            }}>
              Doğrulama Kodu: <strong style={{ color: 'var(--green)', fontSize: 20, letterSpacing: 5, fontFamily: 'monospace' }}>{sentOtp}</strong>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Kodu Girin</label>
              <input
                className="form-input"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleOtpSubmit()}
                placeholder="_ _ _ _ _ _"
                autoFocus
                style={{ textAlign: 'center', fontSize: 28, letterSpacing: 10, fontFamily: 'monospace', padding: '14px' }}
                maxLength={6}
              />
            </div>

            {err && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, textAlign: 'center' }}>{err}</div>}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
              onClick={handleOtpSubmit}
              disabled={otp.length < 6}
            >
              ✓ Giriş Yap
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12 }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => { setStep('email'); setErr(''); setOtp(''); }}>← Geri</button>
              {countdown > 0
                ? <span style={{ color: 'var(--muted)' }}>Yeniden gönder ({countdown}s)</span>
                : <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }} onClick={resend}>Yeniden Gönder</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
