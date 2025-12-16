import { NextResponse } from 'next/server';

export function proxy(request) {
  // Check only requests to /nic, but not /nic/login
  if (request.nextUrl.pathname.startsWith('/nic') && !request.nextUrl.pathname.startsWith('/nic/login') && !request.nextUrl.pathname.startsWith('/nic/docs')) {
    const isAuthenticated = request.cookies.get('nic-auth')?.value === 'authenticated';

    // If already authenticated, continue
    if (isAuthenticated) {
      return NextResponse.next();
    }

    // If not authenticated, redirect to login
    const loginUrl = new URL('/nic/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/nic/:path*']
};
