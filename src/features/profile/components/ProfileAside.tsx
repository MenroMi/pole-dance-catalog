'use client';
import { Heart, LayoutDashboard, TrendingUp } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

const NAV_LINKS = [
  {
    href: '/profile',
    label: 'Overview',
    icon: LayoutDashboard,
    matches: ['/profile'],
    disabled: false,
  },
  {
    href: '/profile/favourite-moves',
    label: 'Favourite Moves',
    icon: Heart,
    matches: ['/profile/favourite-moves'],
    disabled: false,
  },
  {
    href: '/profile/progress',
    label: 'Progress',
    icon: TrendingUp,
    matches: ['/profile/progress'],
    disabled: false,
  },
];

const BASE =
  'mx-4 my-1 flex items-center gap-4 rounded-md px-4 py-3 font-display text-xs uppercase tracking-widest';

export default function ProfileAside() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-2 py-10">
      {NAV_LINKS.map(({ href, label, icon: Icon, matches, disabled }) => {
        if (disabled) {
          return (
            <span
              key={href}
              aria-disabled="true"
              className={`${BASE} cursor-not-allowed text-outline opacity-50 select-none`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] tracking-widest text-on-surface-variant">
                Soon
              </span>
            </span>
          );
        }

        const isActive = matches.includes(pathname);
        if (isActive) {
          return (
            <Link
              key={href}
              href={href}
              aria-current="page"
              className={`${BASE} bg-linear-to-br from-primary to-primary-container font-bold text-surface`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={`${BASE} text-outline transition-all duration-200 hover:translate-x-1 hover:bg-surface-container hover:text-on-surface active:scale-95`}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
