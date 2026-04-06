// middleware.ts — Proje kök dizinine koy
// JWT cookie kontrolü → giriş yapılmamışsa /dashboard erişimi engellenir
//
// Gerekli:  npm install jsonwebtoken
//           npm install --save-dev @types/jsonwebtoken

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify }                 from 'jose';

const JWT_SECRET  = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');
const PUBLIC_PATHS = ['/', '/api/auth/google', '/api/auth/verify-otp', '/api/webhook/n8n'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statik dosyalar ve public path'leri atla
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // /dashboard veya /api/* rotaları için JWT kontrolü
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = req.cookies.get('digipoli_token')?.value;

    if (!token) {
      // API isteği ise 401, sayfa isteği ise login'e yönlendir
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Token geçersiz/süresi dolmuş
      const res = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Token expired' }, { status: 401 })
        : NextResponse.redirect(new URL('/', req.url));
      res.cookies.set('digipoli_token', '', { maxAge: 0, path: '/' });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth|webhook).*)'],
};
