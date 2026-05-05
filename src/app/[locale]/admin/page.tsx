import { getLocale, getTranslations } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';
import { checkedLocale } from '@/i18n/routing';
import { auth } from '@/shared/lib/auth';

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    redirect({ href: '/', locale: checkedLocale(await getLocale()) });
  }
  const t = await getTranslations('admin');
  return <div>{t('title')}</div>;
}
