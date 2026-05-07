import { redirect } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const e = new Error('NEXT_REDIRECT');
    (e as unknown as Record<string, unknown>).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw e;
  }),
}));
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('pl'),
}));
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_pw'),
    compare: vi.fn(),
  },
}));
vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => (key === 'x-forwarded-for' ? '1.2.3.4' : null)),
  }),
}));
vi.mock('@/shared/lib/ratelimit', () => ({
  signupRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  resendRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  forgotPasswordRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock('@/features/auth/lib/reset-tokens', () => ({
  generateResetToken: vi.fn().mockResolvedValue('reset-token-uuid'),
  deleteResetTokensByEmail: vi.fn(),
  findResetToken: vi.fn(),
  deleteResetToken: vi.fn(),
}));
vi.mock('@/features/auth/lib/reset-email', () => ({
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock('@/features/auth/lib/tokens', () => ({
  generateVerificationToken: vi.fn().mockResolvedValue('mock-token'),
  deleteUserTokens: vi.fn(),
}));
vi.mock('@/features/auth/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}));
vi.mock('@/shared/lib/auth', () => ({
  signIn: vi.fn(),
}));
vi.mock('next-auth', async () => {
  class AuthError extends Error {
    cause?: unknown;
    type?: string;
  }
  return { AuthError };
});

import { signupRatelimit, resendRatelimit, forgotPasswordRatelimit } from '@/shared/lib/ratelimit';
import { sendVerificationEmail } from '@/features/auth/lib/email';
import {
  generateResetToken,
  deleteResetTokensByEmail,
  findResetToken,
  deleteResetToken,
} from '@/features/auth/lib/reset-tokens';
import { sendPasswordResetEmail } from '@/features/auth/lib/reset-email';
import { generateVerificationToken, deleteUserTokens } from '@/features/auth/lib/tokens';
import { signIn } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import {
  signupAction,
  loginAction,
  resendVerificationAction,
  checkEmailVerifiedAction,
  forgotPasswordAction,
  resetPasswordAction,
  signInWithOAuthAction,
} from './actions';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;
const mockDelete = prisma.user.delete as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockFindFirstToken = prisma.verificationToken.findFirst as ReturnType<typeof vi.fn>;
const mockGenToken = generateVerificationToken as ReturnType<typeof vi.fn>;
const mockDeleteTokens = deleteUserTokens as ReturnType<typeof vi.fn>;
const mockSendEmail = sendVerificationEmail as ReturnType<typeof vi.fn>;
const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>;
const mockSignupLimit = signupRatelimit.limit as ReturnType<typeof vi.fn>;
const mockResendLimit = resendRatelimit.limit as ReturnType<typeof vi.fn>;
const mockForgotPasswordLimit = forgotPasswordRatelimit.limit as ReturnType<typeof vi.fn>;
const mockGenResetToken = generateResetToken as ReturnType<typeof vi.fn>;
const mockDeleteResetTokensByEmail = deleteResetTokensByEmail as ReturnType<typeof vi.fn>;
const mockFindResetToken = findResetToken as ReturnType<typeof vi.fn>;
const mockDeleteResetToken = deleteResetToken as ReturnType<typeof vi.fn>;
const mockSendResetEmail = sendPasswordResetEmail as ReturnType<typeof vi.fn>;

const validData = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  password: 'Password1!',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSignupLimit.mockResolvedValue({ success: true });
  mockResendLimit.mockResolvedValue({ success: true });
  mockForgotPasswordLimit.mockResolvedValue({ success: true });
});

describe('signupAction', () => {
  it('returns { error: "Too many requests" } when rate limit is exceeded', async () => {
    mockSignupLimit.mockResolvedValue({ success: false });
    const result = await signupAction(validData);
    expect(result).toEqual({ error: 'Too many requests' });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns error if email is already in use', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' });

    const result = await signupAction(validData);

    expect(result).toEqual({ error: 'Email already in use' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates user, generates token, sends email, and redirects on success', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'new-user' });
    mockSendEmail.mockResolvedValue(undefined);

    await expect(signupAction(validData)).rejects.toThrow('NEXT_REDIRECT');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'alice@example.com',
          emailVerified: null,
        }),
      }),
    );
    expect(mockGenToken).toHaveBeenCalledWith('alice@example.com', 'pl');
    expect(mockSendEmail).toHaveBeenCalledWith('alice@example.com', 'mock-token', 'pl');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/pl/verify-email?sent=true&email=alice%40example.com',
    );
  });

  it('deletes user and tokens if Resend fails', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'new-user' });
    mockSendEmail.mockRejectedValue(new Error('Resend API error'));

    const result = await signupAction(validData);

    expect(mockDeleteTokens).toHaveBeenCalledWith('alice@example.com');
    expect(mockDelete).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    expect(result).toEqual({ error: 'Failed to send email, please try again' });
  });

  it('returns error for invalid input (Zod)', async () => {
    const result = await signupAction({
      firstName: '',
      lastName: '',
      email: 'bad',
      password: 'short',
    });
    expect(result).toEqual({ error: 'Invalid input' });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

const mockSignIn = signIn as ReturnType<typeof vi.fn>;

describe('loginAction', () => {
  it('calls signIn with credentials and redirectTo /{locale}/catalog', async () => {
    mockSignIn.mockResolvedValue(undefined);

    const result = await loginAction({ email: 'a@b.com', password: 'pass' });

    expect(result).toBeUndefined();
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'a@b.com',
      password: 'pass',
      redirectTo: '/pl/catalog',
    });
  });

  it('returns generic error for invalid credentials (AuthError without cause.err)', async () => {
    const authError = Object.assign(new Error('CredentialsSignin'), {
      type: 'CredentialsSignin',
      cause: undefined,
    });
    Object.setPrototypeOf(authError, (await import('next-auth')).AuthError.prototype);
    mockSignIn.mockRejectedValue(authError);

    const result = await loginAction({ email: 'a@b.com', password: 'wrong' });

    expect(result).toEqual({ error: 'Invalid credentials' });
  });

  it('returns cause error message and email when authorize throws verify-email error', async () => {
    const authError = Object.assign(new Error('CredentialsSignin'), {
      type: 'CredentialsSignin',
      cause: { err: new Error('Please verify your email first') },
    });
    Object.setPrototypeOf(authError, (await import('next-auth')).AuthError.prototype);
    mockSignIn.mockRejectedValue(authError);

    const result = await loginAction({ email: 'a@b.com', password: 'pass' });

    expect(result).toEqual({ error: 'Please verify your email first', email: 'a@b.com' });
  });

  it('re-throws non-AuthError errors (e.g. NEXT_REDIRECT)', async () => {
    const redirectError = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT' });
    mockSignIn.mockRejectedValue(redirectError);

    await expect(loginAction({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
  });
});

describe('resendVerificationAction', () => {
  it('redirects to rate-limited when rate limit is exceeded', async () => {
    mockResendLimit.mockResolvedValue({ success: false });
    await expect(resendVerificationAction('alice@example.com')).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/pl/verify-email?error=rate-limited');
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('deletes old tokens, generates new token, sends email, then redirects', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-id', emailVerified: null });
    mockFindFirstToken.mockResolvedValue(null);
    mockSendEmail.mockResolvedValue(undefined);

    await expect(resendVerificationAction('alice@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDeleteTokens).toHaveBeenCalledWith('alice@example.com');
    expect(mockGenToken).toHaveBeenCalledWith('alice@example.com', 'pl');
    expect(mockSendEmail).toHaveBeenCalledWith('alice@example.com', 'mock-token', 'pl');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/pl/verify-email?sent=true&email=alice%40example.com',
    );
  });

  it('redirects to invalid if user not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(resendVerificationAction('nobody@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/pl/verify-email?error=invalid');
    expect(mockGenToken).not.toHaveBeenCalled();
  });

  it('redirects to /catalog if user already verified', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-id', emailVerified: new Date() });

    await expect(resendVerificationAction('verified@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/pl/catalog');
    expect(mockGenToken).not.toHaveBeenCalled();
  });

  it('silently redirects without sending if token was created less than 60s ago', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-id', emailVerified: null });
    mockFindFirstToken.mockResolvedValue({
      identifier: 'alice@example.com',
      createdAt: new Date(Date.now() - 10_000), // created 10s ago
    });

    await expect(resendVerificationAction('alice@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith(
      '/pl/verify-email?sent=true&email=alice%40example.com',
    );
    expect(mockGenToken).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('allows resend if token was created more than 60s ago', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-id', emailVerified: null });
    mockFindFirstToken.mockResolvedValue({
      identifier: 'alice@example.com',
      createdAt: new Date(Date.now() - 120_000), // created 120s ago
    });
    mockSendEmail.mockResolvedValue(undefined);

    await expect(resendVerificationAction('alice@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockGenToken).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('deletes token and redirects to send-failed if email sending fails', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-id', emailVerified: null });
    mockFindFirstToken.mockResolvedValue(null);
    mockSendEmail.mockRejectedValue(new Error('Resend error'));

    await expect(resendVerificationAction('alice@example.com')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDeleteTokens).toHaveBeenCalledWith('alice@example.com');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/pl/verify-email?error=send-failed&email=alice%40example.com',
    );
  });
});

describe('checkEmailVerifiedAction', () => {
  it('returns true when user has emailVerified set', async () => {
    mockFindUnique.mockResolvedValue({ emailVerified: new Date('2026-01-01') });

    const result = await checkEmailVerifiedAction('verified@example.com');

    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'verified@example.com' },
      select: { emailVerified: true },
    });
  });

  it('returns false when user emailVerified is null', async () => {
    mockFindUnique.mockResolvedValue({ emailVerified: null });

    const result = await checkEmailVerifiedAction('unverified@example.com');

    expect(result).toBe(false);
  });

  it('returns false when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await checkEmailVerifiedAction('nobody@example.com');

    expect(result).toBe(false);
  });
});

describe('forgotPasswordAction', () => {
  it('returns { sent: true } silently when rate limit is exceeded', async () => {
    mockForgotPasswordLimit.mockResolvedValue({ success: false });

    const result = await forgotPasswordAction('user@example.com');

    expect(result).toEqual({ sent: true });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns { sent: true } and does nothing when email not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await forgotPasswordAction('nobody@example.com');

    expect(result).toEqual({ sent: true });
    expect(mockGenResetToken).not.toHaveBeenCalled();
    expect(mockSendResetEmail).not.toHaveBeenCalled();
  });

  it('returns { sent: true } and does nothing for OAuth user (no password)', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', password: null });

    const result = await forgotPasswordAction('oauth@example.com');

    expect(result).toEqual({ sent: true });
    expect(mockGenResetToken).not.toHaveBeenCalled();
  });

  it('deletes old tokens, generates new token, sends email, returns { sent: true }', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', password: 'hashed' });
    mockSendResetEmail.mockResolvedValue(undefined);

    const result = await forgotPasswordAction('user@example.com');

    expect(mockDeleteResetTokensByEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockGenResetToken).toHaveBeenCalledWith('user@example.com', 'pl');
    expect(mockSendResetEmail).toHaveBeenCalledWith('user@example.com', 'reset-token-uuid', 'pl');
    expect(result).toEqual({ sent: true });
  });

  it('deletes token and returns { sent: true } even when email sending fails', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', password: 'hashed' });
    mockSendResetEmail.mockRejectedValue(new Error('Resend down'));

    const result = await forgotPasswordAction('user@example.com');

    expect(mockDeleteResetToken).toHaveBeenCalledWith('reset-token-uuid');
    expect(result).toEqual({ sent: true });
  });

  it('returns error for invalid email format', async () => {
    const result = await forgotPasswordAction('not-an-email');
    expect(result).toEqual({ error: 'Invalid email' });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe('resetPasswordAction', () => {
  it('returns { error: "invalid" } when token not found', async () => {
    mockFindResetToken.mockResolvedValue(null);

    const result = await resetPasswordAction('missing-token', 'NewPass1!');

    expect(result).toEqual({ error: 'invalid' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns { error: "expired" } when token is expired', async () => {
    mockFindResetToken.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'old-token',
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await resetPasswordAction('old-token', 'NewPass1!');

    expect(result).toEqual({ error: 'expired' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns error for invalid password (fails complexity)', async () => {
    mockFindResetToken.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await resetPasswordAction('valid-token', 'weakpassword');

    expect(result).toEqual({ error: 'Invalid password' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('updates password, deletes token, and redirects to locale login on valid input', async () => {
    mockFindResetToken.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 60_000),
      locale: 'pl',
    });
    mockUserUpdate.mockResolvedValue({});

    await expect(resetPasswordAction('valid-token', 'NewPass1!')).rejects.toThrow('NEXT_REDIRECT');

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      data: { password: 'hashed_pw' },
    });
    expect(mockDeleteResetToken).toHaveBeenCalledWith('valid-token');
    expect(mockRedirect).toHaveBeenCalledWith('/pl/login?reset=true');
  });
});

describe('signInWithOAuthAction', () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue(undefined);
  });

  it('calls signIn with google and locale-prefixed catalog redirectTo', async () => {
    await signInWithOAuthAction('google');
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/pl/catalog' });
  });

  it('preserves a safe relative callbackUrl', async () => {
    await signInWithOAuthAction('google', '/pl/profile');
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/pl/profile' });
  });

  it('strips an external http callbackUrl to locale fallback', async () => {
    await signInWithOAuthAction('google', 'https://evil.com/steal');
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/pl/catalog' });
  });

  it('strips a protocol-relative callbackUrl to locale fallback', async () => {
    await signInWithOAuthAction('google', '//evil.com');
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/pl/catalog' });
  });

  it('strips an empty string callbackUrl to locale fallback', async () => {
    await signInWithOAuthAction('google', '');
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/pl/catalog' });
  });
});
