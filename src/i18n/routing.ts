export const locales = ['pl', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pl';

// Named export used by createNavigation, createMiddleware, and getRequestConfig
export const routing = { locales, defaultLocale } as const;

export function checkedLocale(raw: string): Locale {
  return (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale;
}
