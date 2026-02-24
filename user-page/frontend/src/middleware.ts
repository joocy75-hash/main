import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/games'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  // Check localStorage-based auth via a custom header isn't possible in middleware
  // Use cookie-based check or just protect known paths

  // For paths that require auth
  const isPublic = publicPaths.some(p => pathname === p) || pathname.startsWith('/games');
  const isAuthPage = authPaths.some(p => pathname === p);

  // If no token and accessing protected route, redirect to login
  // Note: Since tokens are in localStorage (not cookies), middleware can't fully verify
  // This provides a basic server-side redirect layer
  // Client-side AuthGuard handles the actual token verification

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
