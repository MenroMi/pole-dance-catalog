import type { NextAuthConfig } from 'next-auth';

export const authBaseConfig = {
  providers: [],
  session: { strategy: 'jwt' as const, maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.blockedAt = (user as { blockedAt?: Date | null }).blockedAt?.toISOString() ?? null;
        if (account?.type === 'oauth' || account?.type === 'oidc') {
          token.name = profile?.name ?? null;
          token.picture = profile?.picture ?? null;
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
        const s = session as { name?: string | null; picture?: string | null } | undefined;
        if (s?.name !== undefined) token.name = s.name;
        if (s?.picture !== undefined) token.picture = s.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = token.role as string | undefined;
        session.user.blockedAt = token.blockedAt as string | null | undefined;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
