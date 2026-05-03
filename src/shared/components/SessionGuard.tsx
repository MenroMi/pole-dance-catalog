'use client';

import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'authenticated') wasAuthenticated.current = true;
    if (status === 'unauthenticated' && wasAuthenticated.current) {
      router.replace('/login');
    }
  }, [status, router]);

  return <>{children}</>;
}
