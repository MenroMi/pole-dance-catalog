import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Space_Grotesk, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';

import { Providers } from '@/shared/components/Providers';
import { locales } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

import '@/app/globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pole Space — Pole Artistry Platform',
  description: 'Catalog of pole dance moves',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
