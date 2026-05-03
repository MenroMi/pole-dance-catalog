import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/shared/lib/auth';

import styles from '@/app/landing.module.css';

export const metadata: Metadata = {
  title: 'pole space — a catalog of pole dance moves',
  description:
    'A small, careful catalog of pole moves — written by performers we know, photographed in studios we visit. No feed, no streaks. Just the moves and your notes.',
};

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params: _params }: Props) {
  const session = await auth();
  if (session) redirect('/catalog');

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
        <div className={styles.eyebrow}>A small catalog</div>
        <h1 className={styles.h1}>
          A quiet place to keep the moves you&apos;re <em>working on</em>.
        </h1>
        <p className={styles.lede}>
          A small, careful catalog of pole moves — written by performers we know, photographed in
          studios we visit. No feed, no streaks. Just the moves and your notes.
        </p>
        <div className={styles.actions}>
          <Link href="/signup" className={styles.btnPrimary}>
            Create an account →
          </Link>
          <Link href="/catalog" className={styles.btnLink}>
            Browse the catalog
          </Link>
        </div>
        <p className={styles.formHint}>Free. No invite needed.</p>
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
