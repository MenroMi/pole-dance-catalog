import bcrypt from 'bcryptjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/ratelimit', () => ({
  signinRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));

vi.mock('next-auth', () => ({
  default: (_config: unknown) => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import { prisma } from '@/shared/lib/prisma';
import { signinRatelimit } from '@/shared/lib/ratelimit';

import { authConfig } from './auth';

const mockRatelimit = signinRatelimit.limit as ReturnType<typeof vi.fn>;

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockCompare = bcrypt.compare as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockRatelimit.mockResolvedValue({ success: true });
});

describe('authConfig', () => {
  it('includes google, facebook, and credentials providers', () => {
    const ids = authConfig.providers.map((p: { id: string }) => p.id);
    expect(ids).toContain('google');
    expect(ids).toContain('facebook');
    expect(ids).toContain('credentials');
  });

  it('uses jwt session strategy', () => {
    expect(authConfig.session?.strategy).toBe('jwt');
  });
});

describe('jwt callback', () => {
  const getJwt = () =>
    authConfig.callbacks?.jwt as (params: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
      account?: Record<string, unknown>;
      profile?: Record<string, unknown>;
      trigger?: string;
      session?: unknown;
    }) => Record<string, unknown>;

  it('sets name from firstName and lastName on sign-in', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: { firstName: 'Alice', lastName: 'Pole', role: 'USER' },
    });
    expect(token.name).toBe('Alice Pole');
  });

  it('sets name to null when firstName and lastName are empty on sign-in', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: { firstName: null, lastName: null, role: 'USER' },
    });
    expect(token.name).toBeNull();
  });

  it('updates token.name when trigger is update and session.name is provided', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: { name: 'Old Name' },
      trigger: 'update',
      session: { name: 'New Name' },
    });
    expect(token.name).toBe('New Name');
  });

  it('leaves token.name unchanged when trigger is update but session.name is absent', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: { name: 'Old Name' },
      trigger: 'update',
      session: {},
    });
    expect(token.name).toBe('Old Name');
  });
});

describe('jwt callback — OAuth branch', () => {
  const getJwt = () =>
    authConfig.callbacks?.jwt as (params: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
      account?: Record<string, unknown>;
      profile?: Record<string, unknown>;
      trigger?: string;
      session?: unknown;
    }) => Record<string, unknown>;

  it('sets name and picture from OAuth profile', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: { role: 'USER' },
      account: { type: 'oauth' },
      profile: { name: 'Ania Kowalska', picture: 'https://example.com/photo.jpg' },
    });
    expect(token.name).toBe('Ania Kowalska');
    expect(token.picture).toBe('https://example.com/photo.jpg');
    expect(token.role).toBe('USER');
  });

  it('sets picture to null when profile has no picture', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: { role: 'USER' },
      account: { type: 'oauth' },
      profile: { name: 'Ania' },
    });
    expect(token.name).toBe('Ania');
    expect(token.picture).toBeNull();
  });
});

describe('jwt callback — credentials branch', () => {
  const getJwt = () =>
    authConfig.callbacks?.jwt as (params: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
      account?: Record<string, unknown>;
      profile?: Record<string, unknown>;
      trigger?: string;
      session?: unknown;
    }) => Record<string, unknown>;

  it('sets picture from user.image', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        role: 'USER',
        image: 'https://example.com/avatar.jpg',
      },
      account: { type: 'credentials' },
    });
    expect(token.name).toBe('Anna Kowalska');
    expect(token.picture).toBe('https://example.com/avatar.jpg');
  });

  it('sets picture to null when user.image is null', async () => {
    const jwt = getJwt();
    const token = await jwt({
      token: {},
      user: { firstName: 'Anna', lastName: null, role: 'USER', image: null },
      account: { type: 'credentials' },
    });
    expect(token.name).toBe('Anna');
    expect(token.picture).toBeNull();
  });
});

describe('session callback', () => {
  const getSession = () =>
    authConfig.callbacks?.session as (params: {
      session: { user: Record<string, unknown>; expires: string };
      token: Record<string, unknown>;
    }) => { user: Record<string, unknown> };

  it('sets session.user.image from token.picture', () => {
    const session = getSession();
    const result = session({
      session: { user: { name: 'Test', email: 'test@test.com' }, expires: '' },
      token: { sub: 'user-1', role: 'USER', picture: 'https://example.com/photo.jpg' },
    });
    expect(result.user.image).toBe('https://example.com/photo.jpg');
  });

  it('does not set image when token.picture is absent', () => {
    const session = getSession();
    const result = session({
      session: { user: { name: 'Test', email: 'test@test.com' }, expires: '' },
      token: { sub: 'user-1', role: 'USER' },
    });
    expect(result.user.image).toBeUndefined();
  });
});

describe('authorize', () => {
  const getAuthorize = () => {
    const provider = authConfig.providers.find(
      (p: { id: string }) => p.id === 'credentials',
    ) as unknown as { options: { authorize: (creds: Record<string, string>) => Promise<unknown> } };
    return provider.options.authorize;
  };

  it('returns null if credentials are missing', async () => {
    const authorize = getAuthorize();
    const result = await authorize({});
    expect(result).toBeNull();
  });

  it('throws rate limit error when signin limit is exceeded', async () => {
    mockRatelimit.mockResolvedValue({ success: false });
    const authorize = getAuthorize();
    await expect(authorize({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(
      'Too many login attempts',
    );
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('throws if user not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const authorize = getAuthorize();
    await expect(authorize({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(
      'find your account',
    );
  });

  it('throws if emailVerified is null', async () => {
    mockFindUnique.mockResolvedValue({ id: '1', password: 'hashed', emailVerified: null });
    const authorize = getAuthorize();
    await expect(authorize({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(
      'Please verify your email first',
    );
  });

  it('returns null if password does not match', async () => {
    mockFindUnique.mockResolvedValue({ id: '1', password: 'hashed', emailVerified: new Date() });
    mockCompare.mockResolvedValue(false);
    const authorize = getAuthorize();
    const result = await authorize({ email: 'a@b.com', password: 'wrong' });
    expect(result).toBeNull();
  });

  it('returns user if credentials are valid and email is verified', async () => {
    const user = { id: '1', password: 'hashed', emailVerified: new Date() };
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    const authorize = getAuthorize();
    const result = await authorize({ email: 'a@b.com', password: 'correct' });
    expect(result).toEqual(user);
  });
});
