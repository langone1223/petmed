import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect /api routes (except public ones)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/register')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
    
    // Check specific role routes
    if (pathname.startsWith('/api/vet/') && token.role !== 'VET') {
      return NextResponse.json({ error: 'Forbidden: VET role required' }, { status: 403 });
    }
  }

  const res = NextResponse.next();
  // Add Security Headers
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
};
