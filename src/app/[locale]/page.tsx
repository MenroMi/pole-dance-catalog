import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import styles from '@/app/landing.module.css';
import { Link, redirect } from '@/i18n/navigation';
import { checkedLocale } from '@/i18n/routing';
import { auth } from '@/shared/lib/auth';

export const metadata: Metadata = {
  title: 'pole space — a catalog of pole dance moves',
  description:
    'A small, careful catalog of pole moves — written by performers we know, photographed in studios we visit. No feed, no streaks. Just the moves and your notes.',
};

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params: _params }: Props) {
  const session = await auth();
  if (session) {
    redirect({ href: '/catalog', locale: checkedLocale(await getLocale()) });
  }
  const t = await getTranslations('landing');

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand} aria-label="pole space">
          pole space
          <span className={styles.dot} aria-hidden="true">
            .
          </span>
        </span>
        <span className={styles.meta}>— catalog · 2026</span>
      </header>

      <main className={styles.center}>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <h1 className={styles.h1}>{t('heading')}</h1>
        <p className={styles.lede}>{t('description')}</p>
        <div className={styles.actions}>
          <Link href="/signup" className={styles.btnPrimary}>
            {t('createAccount')}
          </Link>
          <Link href="/catalog" className={styles.btnLink}>
            {t('browseCatalog')}
          </Link>
        </div>
        <p className={styles.formHint}>{t('hint')}</p>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 pole space</span>
        <span className={styles.madeBy}>
          Made in Zagreb · by <span className={styles.name}>two performers</span>
        </span>
        <span>
          <a href="mailto:contact@polespace.com">contact@polespace.com</a>
        </span>
      </footer>
    </div>
  );
}
