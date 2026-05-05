'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function HeaderNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const NAV_LINKS = [{ label: t('catalog'), href: '/catalog' as const }];

  return (
    <nav className="flex gap-1 justify-self-center rounded-full border border-outline-variant/40 bg-surface-container-lowest p-1">
      {NAV_LINKS.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-5 py-[7px] text-[13px] font-semibold transition-colors ${
              isActive
                ? 'bg-primary/12 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
