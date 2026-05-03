'use client';

import { Link, usePathname } from '@/i18n/navigation';

const NAV_LINKS = [
  { label: 'Catalog', href: '/catalog' },
  // Add more tabs here — the pill stretches automatically.
];

export default function HeaderNav() {
  const pathname = usePathname();

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
