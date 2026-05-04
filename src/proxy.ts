import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';
import { authBaseConfig } from '@/shared/lib/auth.config';

const { auth } = NextAuth(authBaseConfig);

const intlMiddleware = createIntlMiddleware(routing);

const protectedPaths = ['/profile', '/admin'];
const authPaths = ['/login', '/signup', '/verify-email'];

export function getProtectedRedirect(
  pathname: string,
  isAuthenticated: boolean,
  requestUrl: string,
  search: string = '',
): URL | null {
  // pathname includes locale prefix e.g. /pl/profile
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] ?? 'pl';
  const pathWithoutLocale = '/' + segments.slice(1).join('/');

  if (isAuthenticated && authPaths.includes(pathWithoutLocale)) {
    return new URL(`/${locale}/catalog`, requestUrl);
  }
  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/'),
  );
  if (isProtected && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    return new URL(`/${locale}/login?callbackUrl=${callbackUrl}`, requestUrl);
  }
  return null;
}

export default auth(async (req) => {
  const intlResponse = intlMiddleware(req as NextRequest);
  if (intlResponse && intlResponse.status !== 200) return intlResponse;

  const redirectUrl = getProtectedRedirect(
    req.nextUrl.pathname,
    !!req.auth,
    req.url,
    req.nextUrl.search,
  );
  if (redirectUrl) return NextResponse.redirect(redirectUrl);

  // Return intl response so locale headers (x-next-intl-locale etc.) are preserved
  return intlResponse;
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
