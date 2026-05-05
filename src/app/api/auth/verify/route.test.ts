import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/features/auth/lib/tokens', () => ({
  deleteVerificationToken: vi.fn(),
}));

vi.mock('@/shared/lib/ratelimit', () => ({
  verifyRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

import { deleteVerificationToken } from '@/features/auth/lib/tokens';
import { prisma } from '@/shared/lib/prisma';
import { verifyRatelimit } from '@/shared/lib/ratelimit';

import { GET } from './route';

const mockFindUnique = prisma.verificationToken.findUnique as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;
const mockDeleteVerToken = deleteVerificationToken as ReturnType<typeof vi.fn>;
const mockVerifyLimit = verifyRatelimit.limit as ReturnType<typeof vi.fn>;

const makeReq = (search: string) => new NextRequest(`http://localhost/api/auth/verify${search}`);

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyLimit.mockResolvedValue({ success: true });
});

describe('GET /api/auth/verify', () => {
  it('redirects to /pl/verify-email?error=invalid when rate limit is exceeded', async () => {
    mockVerifyLimit.mockResolvedValue({ success: false });
    const res = await GET(makeReq('?token=any'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/verify-email?error=invalid');
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('redirects to /pl/verify-email?error=invalid when token query param is missing', async () => {
    const res = await GET(makeReq(''));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/verify-email?error=invalid');
  });

  it('redirects to /pl/verify-email?error=invalid when token is not found in DB', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeReq('?token=unknown'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/verify-email?error=invalid');
  });

  it('deletes token and redirects to /pl/verify-email?error=expired when token is expired (pl)', async () => {
    mockFindUnique.mockResolvedValue({
      token: 'expired-token',
      identifier: 'user@example.com',
      expires: new Date(Date.now() - 1000),
      locale: 'pl',
    });
    const res = await GET(makeReq('?token=expired-token'));
    expect(mockDeleteVerToken).toHaveBeenCalledWith('expired-token');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/verify-email?error=expired');
    expect(res.headers.get('location')).not.toContain('email=');
  });

  it('deletes token and redirects to /en/verify-email?error=expired when token locale is en', async () => {
    mockFindUnique.mockResolvedValue({
      token: 'expired-en-token',
      identifier: 'user@example.com',
      expires: new Date(Date.now() - 1000),
      locale: 'en',
    });
    const res = await GET(makeReq('?token=expired-en-token'));
    expect(mockDeleteVerToken).toHaveBeenCalledWith('expired-en-token');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/en/verify-email?error=expired');
  });

  it('runs transaction and redirects to /pl/login?verified=true on valid pl token', async () => {
    mockFindUnique.mockResolvedValue({
      token: 'valid-token',
      identifier: 'user@example.com',
      expires: new Date(Date.now() + 60_000),
      locale: 'pl',
    });
    mockTransaction.mockResolvedValue([{}, {}]);
    const res = await GET(makeReq('?token=valid-token'));
    expect(mockTransaction).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/login?verified=true');
  });

  it('redirects to /en/login?verified=true on valid en token', async () => {
    mockFindUnique.mockResolvedValue({
      token: 'en-token',
      identifier: 'user@example.com',
      expires: new Date(Date.now() + 60_000),
      locale: 'en',
    });
    mockTransaction.mockResolvedValue([{}, {}]);
    const res = await GET(makeReq('?token=en-token'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/en/login?verified=true');
  });

  it('redirects to /pl/verify-email?error=server when Prisma throws', async () => {
    mockFindUnique.mockResolvedValue({
      token: 'good-token',
      identifier: 'user@example.com',
      expires: new Date(Date.now() + 60_000),
      locale: 'pl',
    });
    mockTransaction.mockRejectedValue(new Error('DB error'));
    const res = await GET(makeReq('?token=good-token'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/pl/verify-email?error=server');
  });
});
