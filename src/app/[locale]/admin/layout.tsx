import { getLocale } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';
import { checkedLocale } from '@/i18n/routing';
import { auth } from '@/shared/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN' || session.user?.blockedAt) {
    redirect({ href: '/', locale: checkedLocale(await getLocale()) });
  }
  return <>{children}</>;
}
