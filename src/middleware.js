import { NextResponse } from 'next/server';

export function middleware(request) {
  // Prüfe nur Anfragen an /nic, aber nicht /nic/login
  if (request.nextUrl.pathname.startsWith('/nic') && !request.nextUrl.pathname.startsWith('/nic/login') && !request.nextUrl.pathname.startsWith('/nic/docs')) {
    const isAuthenticated = request.cookies.get('nic-auth')?.value === 'authenticated';

    // Wenn bereits authentifiziert, weiterleiten
    if (isAuthenticated) {
      return NextResponse.next();
    }

    // Wenn nicht authentifiziert, zu Login weiterleiten
    const loginUrl = new URL('/nic/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/nic/:path*']
};
