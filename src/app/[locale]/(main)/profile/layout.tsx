import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import ProfileAside from '@/features/profile/components/ProfileAside';
import PageShell from '@/shared/components/PageShell';
import { SessionGuard } from '@/shared/components/SessionGuard';
import { auth } from '@/shared/lib/auth';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  return (
    <SessionGuard>
      <PageShell aside={<ProfileAside />}>{children}</PageShell>
    </SessionGuard>
  );
}
