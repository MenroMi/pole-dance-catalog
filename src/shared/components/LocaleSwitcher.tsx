'use client';
import { Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, defaultLocale } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

const LANGUAGES: { locale: Locale; label: string }[] = [
  { locale: 'pl', label: 'Polski' },
  { locale: 'en', label: 'English' },
];

export default function LocaleSwitcher() {
  const t = useTranslations('nav');
  const raw = useLocale();
  const locale: Locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchLocale(next: Locale) {
    if (next !== locale) {
      const qs = searchParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('changeLanguage')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors hover:border-primary/20 hover:bg-primary/[0.06]"
        >
          <Globe size={18} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <div role="group" aria-label="Language">
          {LANGUAGES.map(({ locale: l, label }) => (
            <DropdownMenuItem
              key={l}
              role="menuitemradio"
              aria-checked={locale === l}
              onSelect={() => switchLocale(l)}
              className="flex items-center gap-2"
            >
              {locale === l && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l7-7a1 1 0 00-1.44-1.44z" />
                </svg>
              )}
              {locale !== l && <span className="w-3" />}
              {label}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
