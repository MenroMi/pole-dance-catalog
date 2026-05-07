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
