# Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Google (and Facebook-guarded) OAuth buttons in LoginForm and SignupForm with loading states, error handling, callbackUrl support, image sync, and i18n.

**Architecture:** A single `signInWithOAuthAction` server action handles redirect with open-redirect protection. JWT/session callbacks are extended to carry `picture` for both OAuth and credentials users. A `signIn` callback in `auth.ts` syncs `firstName` and `image` from the OAuth profile on first login.

**Tech Stack:** NextAuth v5, PrismaAdapter, next-intl, React `useTransition`, Vitest + React Testing Library

---

## File Map

| File                                               | Change                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/shared/lib/auth.config.ts`                    | JWT callback: OAuth branch + `picture` in both branches; session callback: set `image`; `pages.error` |
| `src/shared/types/next-auth.d.ts`                  | Add `picture` to JWT interface                                                                        |
| `src/shared/lib/auth.ts`                           | Add `signIn` callback (firstName + image sync); fix authorize for OAuth-only accounts                 |
| `src/shared/lib/auth.test.ts`                      | Tests for new JWT/session/signIn/authorize behaviour                                                  |
| `src/features/auth/actions.ts`                     | Add `signInWithOAuthAction`                                                                           |
| `src/features/auth/actions.test.ts`                | Tests for `signInWithOAuthAction`                                                                     |
| `src/i18n/messages/en.json`                        | OAuth error keys + button labels                                                                      |
| `src/i18n/messages/pl.json`                        | Same in Polish                                                                                        |
| `src/features/auth/components/LoginForm.tsx`       | Loading state, callbackUrl, OAuth error banner, wired buttons                                         |
| `src/features/auth/components/LoginForm.test.tsx`  | Tests for error banner + button wiring                                                                |
| `src/features/auth/components/SignupForm.tsx`      | Loading state, wired buttons                                                                          |
| `src/features/auth/components/SignupForm.test.tsx` | Test for button wiring                                                                                |

---

## Task 1: JWT/session callbacks + type augmentation

**Files:**

- Modify: `src/shared/lib/auth.config.ts`
- Modify: `src/shared/types/next-auth.d.ts`
- Modify: `src/shared/lib/auth.test.ts`

- [ ] **Step 1: Write failing tests for OAuth JWT branch and session image**

Add to `src/shared/lib/auth.test.ts`. The `getJwt` helper needs `account` and `profile` params — update its type cast too.

```ts
// Replace the existing getJwt helper with this expanded version:
const getJwt = () =>
  authConfig.callbacks?.jwt as (params: {
    token: Record<string, unknown>;
    user?: Record<string, unknown>;
    account?: Record<string, unknown>;
    profile?: Record<string, unknown>;
    trigger?: string;
    session?: unknown;
  }) => Record<string, unknown>;

// Add these new describe blocks after the existing 'jwt callback' describe:

describe('jwt callback — OAuth branch', () => {
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --run src/shared/lib/auth.test.ts
```

Expected: new tests fail — `token.picture` undefined, `session.user.image` undefined.

- [ ] **Step 3: Update `auth.config.ts`**

Replace the entire file content:

```ts
import type { NextAuthConfig } from 'next-auth';

export const authBaseConfig = {
  providers: [],
  session: { strategy: 'jwt' as const, maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        if ((account as { type?: string } | undefined)?.type === 'oauth') {
          token.name = (profile as { name?: string } | undefined)?.name ?? null;
          token.picture = (profile as { picture?: string } | undefined)?.picture ?? null;
        } else {
          const u = user as {
            firstName?: string | null;
            lastName?: string | null;
            image?: string | null;
          };
          token.name = [u.firstName, u.lastName].filter(Boolean).join(' ') || null;
          token.picture = u.image ?? null;
        }
      }
      if (trigger === 'update') {
        const s = session as { name?: string | null } | undefined;
        if (s?.name !== undefined) token.name = s.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = token.role as string | undefined;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 4: Update `next-auth.d.ts`**

Replace with:

```ts
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & { role?: string };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string;
    picture?: string | null;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --run src/shared/lib/auth.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/auth.config.ts src/shared/types/next-auth.d.ts src/shared/lib/auth.test.ts
git commit -m "feat(auth): extend JWT/session callbacks with OAuth name+picture support"
```

---

## Task 2: `signIn` callback + credentials error for OAuth accounts

**Files:**

- Modify: `src/shared/lib/auth.ts`
- Modify: `src/shared/lib/auth.test.ts`

- [ ] **Step 1: Expand the prisma mock in `auth.test.ts` to include `update`**

In `auth.test.ts`, the `vi.mock('@/shared/lib/prisma', ...)` currently only has `findUnique`. Add `update`:

```ts
vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));
```

Also add the mock variable at the top of the file alongside `mockFindUnique`:

```ts
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
```

- [ ] **Step 2: Write failing tests for `signIn` callback and updated `authorize`**

Add to `auth.test.ts`:

```ts
describe('signIn callback', () => {
  const getSignInCb = () =>
    authConfig.callbacks?.signIn as (params: {
      user: { email?: string | null };
      account?: { type?: string } | null;
      profile?: { name?: string; picture?: unknown } | null;
    }) => Promise<boolean>;

  beforeEach(() => {
    mockFindUnique.mockResolvedValue({ firstName: null });
    mockUpdate.mockResolvedValue({});
  });

  it('returns true for credentials sign-in without touching DB', async () => {
    const cb = getSignInCb();
    const result = await cb({
      user: { email: 'a@b.com' },
      account: { type: 'credentials' },
    });
    expect(result).toBe(true);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('sets firstName from profile.name when user has none', async () => {
    const cb = getSignInCb();
    await cb({
      user: { email: 'a@b.com' },
      account: { type: 'oauth' },
      profile: { name: 'Ania Kowalska', picture: 'https://example.com/photo.jpg' },
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'a@b.com' },
        data: expect.objectContaining({ firstName: 'Ania Kowalska' }),
      }),
    );
  });

  it('skips firstName update when user already has one', async () => {
    mockFindUnique.mockResolvedValue({ firstName: 'Already Set' });
    const cb = getSignInCb();
    await cb({
      user: { email: 'a@b.com' },
      account: { type: 'oauth' },
      profile: { name: 'Ania', picture: 'https://example.com/photo.jpg' },
    });
    // update still called (image sync), but data must not contain firstName
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty('firstName');
  });

  it('always syncs image from profile.picture', async () => {
    const cb = getSignInCb();
    await cb({
      user: { email: 'a@b.com' },
      account: { type: 'oauth' },
      profile: { name: 'Ania', picture: 'https://new-photo.jpg' },
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ image: 'https://new-photo.jpg' }),
      }),
    );
  });

  it('extracts picture from Facebook nested object shape', async () => {
    const cb = getSignInCb();
    await cb({
      user: { email: 'a@b.com' },
      account: { type: 'oauth' },
      profile: { name: 'Ania', picture: { data: { url: 'https://fb-photo.jpg' } } },
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ image: 'https://fb-photo.jpg' }),
      }),
    );
  });

  it('skips DB update when no updates needed', async () => {
    mockFindUnique.mockResolvedValue({ firstName: 'Set' });
    const cb = getSignInCb();
    await cb({
      user: { email: 'a@b.com' },
      account: { type: 'oauth' },
      profile: { name: 'Ania' }, // no picture
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// Add inside the existing 'authorize' describe block:
it('throws if user has no password (OAuth-only account)', async () => {
  mockFindUnique.mockResolvedValue({ id: '1', password: null, emailVerified: new Date() });
  const authorize = getAuthorize();
  await expect(authorize({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(
    'Please sign in with Google or Facebook',
  );
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- --run src/shared/lib/auth.test.ts
```

Expected: `signIn callback` tests fail (no callback yet), `throws if user has no password` fails (returns null instead of throwing).

- [ ] **Step 4: Update `auth.ts`**

Replace the entire file:

```ts
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

import { authBaseConfig } from './auth.config';
import { prisma } from './prisma';
import { signinRatelimit } from './ratelimit';

export const authConfig = {
  ...authBaseConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { success } = await signinRatelimit.limit(credentials.email as string);
        if (!success) throw new Error('Too many login attempts. Please try again later.');

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) throw new Error("We couldn't find your account. Try signing up.");
        if (user.emailVerified === null) throw new Error('Please verify your email first.');
        if (!user.password) throw new Error('Please sign in with Google or Facebook');

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        return valid ? user : null;
      },
    }),
  ],
  callbacks: {
    ...authBaseConfig.callbacks,
    async signIn({ user, account, profile }) {
      if ((account as { type?: string } | undefined)?.type === 'oauth' && user.email) {
        const updates: { firstName?: string; image?: string } = {};
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { firstName: true },
        });
        if (existing && !existing.firstName && profile?.name) {
          updates.firstName = profile.name as string;
        }
        const rawPicture = (profile as { picture?: unknown } | undefined)?.picture;
        const picture =
          typeof rawPicture === 'string'
            ? rawPicture
            : (rawPicture as { data?: { url?: string } } | undefined)?.data?.url;
        if (picture) updates.image = picture;
        if (Object.keys(updates).length > 0) {
          await prisma.user.update({ where: { email: user.email }, data: updates });
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --run src/shared/lib/auth.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/auth.ts src/shared/lib/auth.test.ts
git commit -m "feat(auth): add OAuth signIn callback and fix credentials error for OAuth accounts"
```

---

## Task 3: `signInWithOAuthAction`

**Files:**

- Modify: `src/features/auth/actions.ts`
- Modify: `src/features/auth/actions.test.ts`

- [ ] **Step 1: Write failing tests**

In `actions.test.ts`, add `signInWithOAuthAction` to the import from `./actions`:

```ts
import {
  signupAction,
  loginAction,
  resendVerificationAction,
  checkEmailVerifiedAction,
  forgotPasswordAction,
  resetPasswordAction,
  signInWithOAuthAction, // ← add
} from './actions';
```

Add `mockSignIn` variable alongside the other mock variables (line ~96):

```ts
const mockSignIn = signIn as ReturnType<typeof vi.fn>;
```

Add new describe block:

```ts
describe('signInWithOAuthAction', () => {
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --run src/features/auth/actions.test.ts
```

Expected: `signInWithOAuthAction` tests fail — function not exported.

- [ ] **Step 3: Add `signInWithOAuthAction` to `actions.ts`**

Add at the end of `src/features/auth/actions.ts`:

```ts
export async function signInWithOAuthAction(provider: 'google' | 'facebook', callbackUrl?: string) {
  const locale = checkedLocale(await getLocale());
  const safeFallback = `/${locale}/catalog`;
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : safeFallback;
  await signIn(provider, { redirectTo });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --run src/features/auth/actions.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/actions.ts src/features/auth/actions.test.ts
git commit -m "feat(auth): add signInWithOAuthAction with open-redirect protection"
```

---

## Task 4: i18n keys

**Files:**

- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/pl.json`

- [ ] **Step 1: Add keys to `en.json`**

In `auth.errors` object (after `"sendEmailFailed"` line), add:

```json
"oauthAccountNotLinked": "An account with this email already exists. Please sign in with your email and password.",
"oauthCallbackError": "Authentication failed. Please try again.",
"oauthSignin": "Could not start sign-in. Please try again.",
"oauthGeneric": "Sign-in failed. Please try again.",
"pleaseSignInWithOAuth": "This account uses Google or Facebook sign-in. Please use one of the buttons below."
```

In `auth.login` object (after `"resendVerificationLink"` line), add:

```json
"continueWithGoogle": "Continue with Google",
"continueWithFacebook": "Continue with Facebook"
```

In `auth.signup` object (after `"lastNamePlaceholder"` line), add:

```json
"continueWithGoogle": "Continue with Google",
"continueWithFacebook": "Continue with Facebook"
```

- [ ] **Step 2: Add keys to `pl.json`**

In `auth.errors`, add after `"sendEmailFailed"`:

```json
"oauthAccountNotLinked": "Konto z tym adresem e-mail już istnieje. Zaloguj się przy użyciu adresu e-mail i hasła.",
"oauthCallbackError": "Uwierzytelnianie nie powiodło się. Spróbuj ponownie.",
"oauthSignin": "Nie można rozpocząć logowania. Spróbuj ponownie.",
"oauthGeneric": "Logowanie nie powiodło się. Spróbuj ponownie.",
"pleaseSignInWithOAuth": "To konto używa logowania przez Google lub Facebook. Użyj jednego z przycisków poniżej."
```

In `auth.login` (after `"resendVerificationLink"`):

```json
"continueWithGoogle": "Kontynuuj z Google",
"continueWithFacebook": "Kontynuuj z Facebook"
```

In `auth.signup` (after `"lastNamePlaceholder"`):

```json
"continueWithGoogle": "Kontynuuj z Google",
"continueWithFacebook": "Kontynuuj z Facebook"
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
npm test -- --run
```

Expected: all 470+ tests pass (i18n keys have no unit tests, but structure validation runs implicitly via component tests).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages/en.json src/i18n/messages/pl.json
git commit -m "feat(i18n): add OAuth error messages and button labels"
```

---

## Task 5: LoginForm — OAuth wiring, error banner, loading state

**Files:**

- Modify: `src/features/auth/components/LoginForm.tsx`
- Modify: `src/features/auth/components/LoginForm.test.tsx`

- [ ] **Step 1: Write failing tests**

In `LoginForm.test.tsx`, add `signInWithOAuthAction` to the actions mock:

```ts
vi.mock('@/features/auth/actions', () => ({
  loginAction: vi.fn(),
  signInWithOAuthAction: vi.fn(),
}));
```

Add import and mock variable after `mockLoginAction`:

```ts
import { loginAction, signInWithOAuthAction } from '@/features/auth/actions';
const mockSignInWithOAuthAction = signInWithOAuthAction as ReturnType<typeof vi.fn>;
```

Add new test cases:

```ts
describe('OAuth buttons', () => {
  it('calls signInWithOAuthAction with google when Google button clicked', async () => {
    mockSignInWithOAuthAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /continueWithGoogle/i }));
    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith('google', undefined);
  });

  it('passes callbackUrl from search params to signInWithOAuthAction', async () => {
    mockSignInWithOAuthAction.mockResolvedValue(undefined);
    mockUseSearchParams.mockReturnValue(new URLSearchParams('callbackUrl=/pl/profile'));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /continueWithGoogle/i }));
    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith('google', '/pl/profile');
  });
});

describe('OAuth error banner', () => {
  it('shows account-not-linked message for OAuthAccountNotLinked error', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=OAuthAccountNotLinked'));
    render(<LoginForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('oauthAccountNotLinked');
  });

  it('shows generic message for unknown OAuth error code', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=SomeUnknownError'));
    render(<LoginForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('oauthGeneric');
  });

  it('shows no OAuth error banner when error param is absent', () => {
    render(<LoginForm />);
    // Only one alert possible: root form error. No error param = no OAuth banner.
    expect(screen.queryByText('oauthGeneric')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --run src/features/auth/components/LoginForm.test.tsx
```

Expected: new tests fail — buttons don't call the action, no error banner rendered.

- [ ] **Step 3: Update `LoginForm.tsx`**

Replace the entire file:

```tsx
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { PasswordInput } from '@/shared/components/PasswordInput';

import { loginAction, signInWithOAuthAction } from '../actions';
import { loginSchema } from '../lib/validation';
import type { LoginFormData } from '../lib/validation';

import { FacebookIcon, GoogleIcon } from './SocialIcons';

const OAUTH_ERROR_MAP: Record<string, string> = {
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  OAuthCallbackError: 'oauthCallbackError',
  OAuthSignin: 'oauthSignin',
};

const facebookEnabled = process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === 'true';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const te = useTranslations('auth.errors');
  const searchParams = useSearchParams();
  const showResetBanner = searchParams.get('reset') === 'true';
  const showVerifiedBanner = searchParams.get('verified') === 'true';
  const oauthErrorCode = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    const result = await loginAction(data);
    if (result?.error) {
      setError('root', { message: result.error });
      if (result.email) setUnverifiedEmail(result.email);
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'facebook') => {
    setPendingProvider(provider);
    startTransition(async () => {
      await signInWithOAuthAction(provider, callbackUrl);
    });
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          {t('title')}
        </h2>
        <p className="text-sm text-on-surface-variant">{t('subtitle')}</p>
      </div>

      {showResetBanner && (
        <p
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/8 px-3.5 py-3 text-sm text-green-400"
        >
          {t('resetBanner')}
        </p>
      )}

      {showVerifiedBanner && (
        <p
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/8 px-3.5 py-3 text-sm text-green-400"
        >
          {t('verifiedBanner')}
        </p>
      )}

      {oauthErrorCode && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-400"
        >
          {te(OAUTH_ERROR_MAP[oauthErrorCode] ?? 'oauthGeneric')}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          {/* Email */}
          <div className="group">
            <label
              htmlFor="email"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('emailLabel')}
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="performer@polespace.com"
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="group">
            <div className="mb-1 flex items-end justify-between">
              <label
                htmlFor="password"
                className="block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
              >
                {t('passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] tracking-widest text-primary/60 uppercase transition-colors duration-200 hover:text-primary"
              >
                {t('forgot')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {errors.root && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-400"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {(
                {
                  'Invalid credentials': te('invalidCredentials'),
                  'Please verify your email first': te('verifyEmailFirst'),
                  'Please sign in with Google or Facebook': te('pleaseSignInWithOAuth'),
                } as Record<string, string>
              )[errors.root.message ?? ''] ?? errors.root.message}
              {unverifiedEmail && (
                <>
                  {' — '}
                  <Link
                    href={`/verify-email?sent=true&email=${encodeURIComponent(unverifiedEmail)}`}
                    className="underline underline-offset-4 hover:text-red-300"
                  >
                    {t('resendVerificationLink')}
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <div className="space-y-6">
        <div className="relative flex items-center">
          <div className="h-px grow bg-outline-variant/20" />
          <span className="mx-4 shrink text-[10px] tracking-widest text-outline-variant uppercase">
            {t('orContinueWith')}
          </span>
          <div className="h-px grow bg-outline-variant/20" />
        </div>

        {facebookEnabled ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('google')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {pendingProvider === 'google' ? '...' : t('continueWithGoogle')}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('facebook')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FacebookIcon />
              {pendingProvider === 'facebook' ? '...' : t('continueWithFacebook')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleOAuthSignIn('google')}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {pendingProvider === 'google' ? '...' : t('continueWithGoogle')}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        {t('noAccount')}{' '}
        <Link
          href="/signup"
          className="ml-1 font-bold text-primary decoration-2 underline-offset-4 hover:underline"
        >
          {t('createAccount')}
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --run src/features/auth/components/LoginForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/components/LoginForm.tsx src/features/auth/components/LoginForm.test.tsx
git commit -m "feat(auth): wire Google OAuth in LoginForm with loading state and error banner"
```

---

## Task 6: SignupForm — OAuth wiring and loading state

**Files:**

- Modify: `src/features/auth/components/SignupForm.tsx`
- Modify: `src/features/auth/components/SignupForm.test.tsx`

- [ ] **Step 1: Write failing test**

In `SignupForm.test.tsx`, add `signInWithOAuthAction` to the actions mock and add test:

```ts
vi.mock('@/features/auth/actions', () => ({
  signupAction: vi.fn(),
  signInWithOAuthAction: vi.fn(),
}));
```

Add import and mock variable:

```ts
import { signupAction, signInWithOAuthAction } from '@/features/auth/actions';
const mockSignupAction = signupAction as ReturnType<typeof vi.fn>;
const mockSignInWithOAuthAction = signInWithOAuthAction as ReturnType<typeof vi.fn>;
```

Add test case:

```ts
describe('OAuth buttons', () => {
  it('calls signInWithOAuthAction with google when Google button clicked', async () => {
    mockSignInWithOAuthAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.click(screen.getByRole('button', { name: /continueWithGoogle/i }));
    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith('google', undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/features/auth/components/SignupForm.test.tsx
```

Expected: new test fails — button does not call the action.

- [ ] **Step 3: Update `SignupForm.tsx`**

Replace the entire file:

```tsx
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { PasswordInput } from '@/shared/components/PasswordInput';

import { signupAction, signInWithOAuthAction } from '../actions';
import { signupSchema } from '../lib/validation';
import type { SignupFormData } from '../lib/validation';

import { FacebookIcon, GoogleIcon } from './SocialIcons';

const facebookEnabled = process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === 'true';

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const te = useTranslations('auth.errors');
  const [detectedLocation, setDetectedLocation] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) return;
          const data = (await res.json()) as { location?: string | null };
          if (data.location) setDetectedLocation(data.location);
        } catch {
          // silent — location is optional
        }
      },
      () => {
        // permission denied or unavailable — silent
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    const result = await signupAction({
      ...data,
      ...(detectedLocation ? { location: detectedLocation } : {}),
    });
    if (result?.error) {
      setError('root', { message: result.error });
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'facebook') => {
    setPendingProvider(provider);
    startTransition(async () => {
      await signInWithOAuthAction(provider, undefined);
    });
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          {t('title')}
        </h2>
        <p className="text-sm text-on-surface-variant">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          {/* First Name */}
          <div className="group">
            <label
              htmlFor="firstName"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('firstNameLabel')}
            </label>
            <div className="relative">
              <input
                id="firstName"
                type="text"
                placeholder={t('firstNamePlaceholder')}
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.firstName && (
              <p
                id="firstName-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="group">
            <label
              htmlFor="lastName"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('lastNameLabel')}
            </label>
            <div className="relative">
              <input
                id="lastName"
                type="text"
                placeholder={t('lastNamePlaceholder')}
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.lastName && (
              <p
                id="lastName-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="group">
            <label
              htmlFor="email"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('emailLabel')}
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="performer@polespace.com"
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="group">
            <label
              htmlFor="password"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('passwordLabel')}
            </label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {errors.root && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-400"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {(
              {
                'Too many requests': te('tooManyRequests'),
                'Invalid input': te('invalidInput'),
                'Email already in use': te('emailAlreadyInUse'),
                'Failed to send email, please try again': te('sendEmailFailed'),
              } as Record<string, string>
            )[errors.root.message ?? ''] ?? errors.root.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <div className="space-y-6">
        <div className="relative flex items-center">
          <div className="h-px grow bg-outline-variant/20" />
          <span className="mx-4 shrink text-[10px] tracking-widest text-outline-variant uppercase">
            {t('orContinueWith')}
          </span>
          <div className="h-px grow bg-outline-variant/20" />
        </div>

        {facebookEnabled ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('google')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {pendingProvider === 'google' ? '...' : t('continueWithGoogle')}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('facebook')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FacebookIcon />
              {pendingProvider === 'facebook' ? '...' : t('continueWithFacebook')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleOAuthSignIn('google')}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {pendingProvider === 'google' ? '...' : t('continueWithGoogle')}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="ml-1 font-bold text-primary decoration-2 underline-offset-4 hover:underline"
        >
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --run src/features/auth/components/SignupForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --run
```

Expected: all tests pass (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/components/SignupForm.tsx src/features/auth/components/SignupForm.test.tsx
git commit -m "feat(auth): wire Google OAuth in SignupForm with loading state"
```
