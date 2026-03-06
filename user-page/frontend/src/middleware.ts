import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/wallet',
  '/profile',
  '/affiliate',
  '/messages',
  '/support',
  '/promotions/attendance',
  '/promotions/missions',
  '/promotions/spin',
  '/promotions/points',
  '/promotions/vip',
];

const AUTH_PAGES = ['/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has('accessToken');
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  // Unauthenticated users on protected routes → redirect to home
  if (!hasAccessToken && isProtected) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Authenticated users on auth pages → redirect to home
  if (hasAccessToken && isAuthPage) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
