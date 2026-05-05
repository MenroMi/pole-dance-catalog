import { getLocale, getTranslations } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';
import { defaultLocale, locales } from '@/i18n/routing';
import { auth } from '@/shared/lib/auth';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    const raw = await getLocale();
    const locale = (locales as readonly string[]).includes(raw)
      ? (raw as (typeof locales)[number])
      : defaultLocale;
    redirect({ href: '/', locale });
  }
  const t = await getTranslations('admin');
  return <div>{t('title')}</div>;
}
