# OAuth Sign-In (Google + Facebook) — Design Spec

**Date:** 2026-05-06
**Branch:** feat/google-oauth

## Overview

Wire up existing Google and Facebook OAuth buttons in `LoginForm` and `SignupForm`. Both providers are already registered in `auth.ts` with PrismaAdapter; the buttons render but have no `onClick`. This spec covers the full production-quality implementation: server action, JWT/session callback fixes, loading states, error handling, account linking conflict messaging, callbackUrl support with open-redirect protection, image sync, and i18n.

Facebook is included in the code but its button is env-guarded — it becomes visible only when `NEXT_PUBLIC_FACEBOOK_ENABLED=true` is set (requires Facebook Developer setup, currently blocked by Meta account restrictions).

---

## Scope

- Google OAuth: fully functional
- Facebook OAuth: code complete, env-guarded (hidden until credentials configured)
- Apple: out of scope
- Account linking UI (linking Google to an existing credentials account): out of scope — show a clear error instead

---

## Architecture & Data Flow

```
User clicks OAuth button
  → handleOAuthSignIn(provider) [LoginForm/SignupForm — useTransition]
  → signInWithOAuthAction(provider, callbackUrl?) [Server Action]
      → validate callbackUrl (relative path only)
      → signIn(provider, { redirectTo }) [NextAuth]
  → Browser redirects to Google/Facebook
  → /api/auth/callback/[provider] [NextAuth callback handler]
      → PrismaAdapter creates or finds User + Account records
      → signIn() callback in auth.ts
          → if OAuth + firstName is null: set firstName = profile.name
          → always sync user.image = profile.picture (Google photo may change)
      → jwt() callback in auth.config.ts
          → OAuth branch: token.name = profile.name, token.picture = profile.picture
          → Credentials branch: token.name = firstName + lastName, token.picture = user.image
      → session() callback: session.user.image = token.picture
  → Redirect to callbackUrl or /{locale}/catalog
```

---

## Files Changed

| File                                          | Change                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/features/auth/actions.ts`                | Add `signInWithOAuthAction`                                                                 |
| `src/shared/lib/auth.ts`                      | Add `signIn` callback; fix credentials error for OAuth accounts                             |
| `src/shared/lib/auth.config.ts`               | Fix JWT callback (both branches + picture); fix session callback (image); add `pages.error` |
| `src/shared/types/next-auth.d.ts`             | Add `image?: string \| null` to session User type                                           |
| `src/features/auth/components/LoginForm.tsx`  | Loading state, callbackUrl, OAuth error banner                                              |
| `src/features/auth/components/SignupForm.tsx` | Loading state                                                                               |
| `src/i18n/messages/en.json`                   | OAuth error keys + button labels                                                            |
| `src/i18n/messages/pl.json`                   | Same in Polish                                                                              |

---

## Implementation Details

### 1. `signInWithOAuthAction`

```ts
// src/features/auth/actions.ts
export async function signInWithOAuthAction(provider: 'google' | 'facebook', callbackUrl?: string) {
  const locale = checkedLocale(await getLocale());
  const safeFallback = `/${locale}/catalog`;

  // Open-redirect guard: only allow relative paths
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : safeFallback;

  await signIn(provider, { redirectTo });
}
```

### 2. `signIn` callback in `auth.ts`

Added to `authConfig` (not edge-safe `authBaseConfig` — requires Prisma):

```ts
async signIn({ user, account, profile }) {
  if (account?.type === 'oauth' && user.email) {
    const updates: { firstName?: string; image?: string | null } = {};
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
      select: { firstName: true },
    });
    if (existing && !existing.firstName && profile?.name) {
      updates.firstName = profile.name as string;
    }
    // Google: profile.picture is a string URL
    // Facebook: profile.picture may be an object { data: { url } } — NextAuth normalizes
    // this in its provider profile() fn, but the raw profile here may differ.
    // Safe extraction handles both shapes:
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
}
```

### 3. Better error for credentials login on OAuth-only account

In `auth.ts` `authorize` callback, replace `return null` when `!user.password`:

```ts
if (!user.password) throw new Error('Please sign in with Google or Facebook');
```

### 4. JWT callback changes (`auth.config.ts`)

```ts
jwt({ token, user, account, profile, trigger, session }) {
  if (user) {
    token.role = (user as { role?: string }).role;

    if (account?.type === 'oauth') {
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
```

### 5. Session callback changes (`auth.config.ts`)

```ts
session({ session, token }) {
  if (session.user) {
    if (token.sub) session.user.id = token.sub;
    session.user.role = token.role as string | undefined;
    if (token.picture) session.user.image = token.picture as string;
  }
  return session;
},
```

### 6. `pages` config (`auth.config.ts`)

```ts
pages: { signIn: '/login', error: '/login' },
```

With `error: '/login'`, OAuth errors redirect to `/{locale}/login?error=<code>` (next-intl middleware adds locale prefix). LoginForm reads `?error=` and shows a translated banner.

### 7. Type augmentation (`next-auth.d.ts`)

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      image?: string | null; // ← add
    } & DefaultSession['user'];
  }
}
```

### 8. Loading state in forms

Both `LoginForm` and `SignupForm` use `useTransition` + `pendingProvider` state:

```tsx
const [isPending, startTransition] = useTransition();
const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null);

const handleOAuthSignIn = (provider: 'google' | 'facebook') => {
  setPendingProvider(provider);
  startTransition(async () => {
    const callbackUrl = searchParams.get('callbackUrl') ?? undefined;
    await signInWithOAuthAction(provider, callbackUrl);
  });
};
```

Both OAuth buttons are disabled while `isPending`. The button that was clicked shows a spinner; the other shows its label dimmed.

### 9. OAuth error banner in `LoginForm`

```tsx
const oauthError = searchParams.get('error');
```

Displayed above the form when present. Error code map (i18n keys):

| NextAuth error code     | Message key                         |
| ----------------------- | ----------------------------------- |
| `OAuthAccountNotLinked` | `auth.errors.oauthAccountNotLinked` |
| `OAuthCallbackError`    | `auth.errors.oauthCallbackError`    |
| `OAuthSignin`           | `auth.errors.oauthSignin`           |
| anything else           | `auth.errors.oauthGeneric`          |

The banner uses the same amber/warning styling consistent with the existing error UI.

Additionally, the existing root error map in LoginForm gets a new entry:

```ts
'Please sign in with Google or Facebook': te('pleaseSignInWithOAuth'),
```

### 10. Facebook env-guard

Button visibility controlled by `NEXT_PUBLIC_FACEBOOK_ENABLED`:

```tsx
{
  process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === 'true' && (
    <button onClick={() => handleOAuthSignIn('facebook')}>...</button>
  );
}
```

When only Google is enabled, the social section renders a single full-width Google button instead of a 2-column grid.

### 11. i18n keys

**`en.json`** additions:

```json
"auth": {
  "errors": {
    "oauthAccountNotLinked": "An account with this email already exists. Please sign in with your email and password.",
    "oauthCallbackError": "Authentication failed. Please try again.",
    "oauthSignin": "Could not start sign-in. Please try again.",
    "oauthGeneric": "Sign-in failed. Please try again.",
    "pleaseSignInWithOAuth": "This account uses Google or Facebook sign-in. Please use one of the buttons below."
  },
  "login": {
    "continueWithGoogle": "Continue with Google",
    "continueWithFacebook": "Continue with Facebook"
  },
  "signup": {
    "continueWithGoogle": "Continue with Google",
    "continueWithFacebook": "Continue with Facebook"
  }
}
```

**`pl.json`** — same keys in Polish.

---

## Error Cases & Handling

| Scenario                                   | Behaviour                                                           |
| ------------------------------------------ | ------------------------------------------------------------------- |
| User cancels Google consent screen         | Redirected to `/login?error=OAuthSignin` → generic error banner     |
| Same email exists with credentials account | `OAuthAccountNotLinked` → banner: "sign in with email and password" |
| OAuth account tries credentials login      | `authorize` throws → LoginForm shows "use Google or Facebook"       |
| `callbackUrl` is external URL              | Stripped, replaced with `/{locale}/catalog`                         |
| `FACEBOOK_CLIENT_ID` not set               | Facebook button hidden                                              |
| Network error during OAuth                 | `OAuthCallbackError` → generic error banner                         |

---

## Tests

| Test                                                                  | Location             |
| --------------------------------------------------------------------- | -------------------- |
| `signInWithOAuthAction` — correct redirectTo with locale              | `actions.test.ts`    |
| `signInWithOAuthAction` — strips external callbackUrl                 | `actions.test.ts`    |
| `signInWithOAuthAction` — preserves safe relative callbackUrl         | `actions.test.ts`    |
| JWT callback — OAuth branch sets name + picture from profile          | `auth.test.ts`       |
| JWT callback — credentials branch sets name + picture from user.image | `auth.test.ts`       |
| LoginForm — renders OAuth error banner for `OAuthAccountNotLinked`    | `LoginForm.test.tsx` |
| LoginForm — renders generic OAuth error banner for unknown error      | `LoginForm.test.tsx` |
| LoginForm — Google button disabled while `isPending`                  | `LoginForm.test.tsx` |

---

## Out of Scope

- Account linking UI (merge credentials + OAuth accounts)
- Apple Sign In
- OAuth for admin-only flows
- Playwright e2e tests (tracked separately)
