import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

import { authBaseConfig } from './auth.config';
import { prisma } from './prisma';
import { signinRatelimit } from './ratelimit';

const baseAdapter = PrismaAdapter(prisma);

export const authConfig = {
  ...authBaseConfig,
  adapter: {
    ...baseAdapter,
    // Our schema uses firstName instead of the standard NextAuth 'name' field
    createUser: (user: Parameters<NonNullable<typeof baseAdapter.createUser>>[0]) => {
      const { name, ...rest } = user;
      return baseAdapter.createUser!({ ...rest, firstName: name ?? null } as typeof user);
    },
  },
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
        if (user.blockedAt) throw new Error('Your account has been blocked. Contact support.');
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
      if ((account?.type === 'oidc' || account?.type === 'oauth') && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
            select: { firstName: true, image: true, blockedAt: true },
          });
          if (existing?.blockedAt) return false;
          if (existing) {
            const updates: { firstName?: string; image?: string } = {};
            if (!existing.firstName && profile?.name) {
              updates.firstName = profile.name;
            }
            const rawPicture = (profile as { picture?: unknown } | undefined)?.picture;
            const picture =
              typeof rawPicture === 'string'
                ? rawPicture
                : rawPicture !== null && typeof rawPicture === 'object' && 'data' in rawPicture
                  ? (rawPicture as { data?: { url?: string } }).data?.url
                  : undefined;
            if (picture && !existing.image) updates.image = picture;
            if (Object.keys(updates).length > 0) {
              await prisma.user.update({ where: { email: user.email }, data: updates });
            }
          }
        } catch (err) {
          console.error('[signIn] profile sync failed:', err);
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
