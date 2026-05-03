export const locales = ['pl', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pl';

// Named export used by createNavigation, createMiddleware, and getRequestConfig
export const routing = { locales, defaultLocale } as const;
