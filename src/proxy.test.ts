import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn((handler: unknown) => handler),
  })),
}));

vi.mock('@/shared/lib/auth.config', () => ({
  authBaseConfig: {},
}));

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url: URL) => ({ redirectUrl: url })),
    next: vi.fn(() => ({ type: 'next' })),
  },
}));

import { getProtectedRedirect } from './proxy';

describe('getProtectedRedirect', () => {
  it('returns null for public route', () => {
    expect(getProtectedRedirect('/pl/catalog', false, 'http://localhost')).toBeNull();
    expect(getProtectedRedirect('/en/catalog', true, 'http://localhost')).toBeNull();
  });

  it('redirects unauthenticated user from /pl/profile to /pl/login', () => {
    const url = getProtectedRedirect('/pl/profile', false, 'http://localhost');
    expect(url).not.toBeNull();
    expect(url!.pathname).toBe('/pl/login');
  });

  it('redirects unauthenticated user from /en/profile to /en/login', () => {
    const url = getProtectedRedirect('/en/profile', false, 'http://localhost');
    expect(url).not.toBeNull();
    expect(url!.pathname).toBe('/en/login');
  });

  it('redirects unauthenticated user from /pl/admin to /pl/login', () => {
    const url = getProtectedRedirect('/pl/admin', false, 'http://localhost');
    expect(url).not.toBeNull();
    expect(url!.pathname).toBe('/pl/login');
  });

  it('returns null for authenticated user on /pl/profile', () => {
    expect(getProtectedRedirect('/pl/profile', true, 'http://localhost')).toBeNull();
  });

  it('redirects authenticated user from /pl/login to /pl/catalog', () => {
    const url = getProtectedRedirect('/pl/login', true, 'http://localhost');
    expect(url).not.toBeNull();
    expect(url!.pathname).toBe('/pl/catalog');
  });

  it('redirects authenticated user from /en/signup to /en/catalog', () => {
    const url = getProtectedRedirect('/en/signup', true, 'http://localhost');
    expect(url).not.toBeNull();
    expect(url!.pathname).toBe('/en/catalog');
  });

  it('preserves search in callbackUrl', () => {
    const url = getProtectedRedirect('/pl/profile', false, 'http://localhost', '?tab=progress');
    expect(url).not.toBeNull();
    expect(url!.searchParams.get('callbackUrl')).toBe('/pl/profile?tab=progress');
  });
});
