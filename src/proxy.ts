/**
 * Next.js Proxy — protects authenticated routes.
 * (Renamed from middleware.ts per Next.js 16 convention)
 * Checks for a lightweight `__session` cookie set client-side after login.
 */
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/learn', '/dashboard', '/roadmap', '/resources', '/profile', '/onboarding'];
const AUTH_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (set client-side after Firebase auth)
  const sessionCookie = request.cookies.get('__session')?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Redirect unauthenticated users away from protected routes
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - API routes (auth happens at the route handler level via token verification)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
