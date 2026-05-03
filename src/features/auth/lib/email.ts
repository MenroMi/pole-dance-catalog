import { getTranslations } from 'next-intl/server';
import { Resend } from 'resend';

import type { Locale } from '@/i18n/routing';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: Locale,
): Promise<void> {
  const t = await getTranslations({ locale, namespace: 'emails.verification' });
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: t('subject'),
    html: `
      <h2>${t('heading')}</h2>
      <p>${t('body')}</p>
      <a href="${verifyUrl}">${t('cta')}</a>
      <p>${t('expiry')}</p>
      <p>${t('ignore')}</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
