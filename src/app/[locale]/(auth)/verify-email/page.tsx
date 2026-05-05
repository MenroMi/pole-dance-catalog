import { getLocale, getTranslations } from 'next-intl/server';

import { resendVerificationAction } from '@/features/auth';
import { getResendCooldownRemaining } from '@/features/auth/lib/cooldown';
import { redirect, Link } from '@/i18n/navigation';
import { checkedLocale } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { prisma } from '@/shared/lib/prisma';

import { ExpiredEmailForm } from './ExpiredEmailForm';
import { ResendForm } from './ResendForm';

type Props = {
  searchParams: Promise<{ sent?: string; error?: string; email?: string }>;
};

function EnvelopeIcon() {
  return (
    <svg
      className="h-10 w-10 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.25}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="h-10 w-10 text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.25}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

async function requireUnverifiedUser(email: string | undefined, locale: Locale): Promise<string> {
  if (!email) redirect({ href: '/signup', locale });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect({ href: '/signup', locale });
  if (user && user.emailVerified !== null) redirect({ href: '/catalog', locale });
  return email!;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { sent, error, email } = await searchParams;
  const locale = checkedLocale(await getLocale());
  const t = await getTranslations('auth.verifyEmail');

  if (sent) {
    const validEmail = await requireUnverifiedUser(email, locale);

    // Token must exist and not be expired — otherwise redirect to expired state
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: validEmail },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.expires < new Date()) {
      redirect({ href: '/verify-email?error=expired', locale });
    }

    const initialRemaining = await getResendCooldownRemaining(validEmail);
    const resendWithEmail = resendVerificationAction.bind(null, validEmail);

    return (
      <div className="w-full max-w-sm animate-fade-in-up space-y-10">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/20">
            <EnvelopeIcon />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
              {t('sentHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{t('sentBody')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <ResendForm
            action={resendWithEmail}
            initialRemaining={initialRemaining}
            email={validEmail}
          />
          <Link
            href="/login"
            className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
          >
            {t('backToSignIn')}
          </Link>
        </div>

        <div className="border-t border-outline-variant/15 pt-2">
          <p className="text-[10px] tracking-widest text-outline uppercase">{t('spamNote')}</p>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="w-full max-w-sm animate-fade-in-up space-y-10">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <WarningIcon />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
              {t('expiredHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{t('expiredBody')}</p>
          </div>
        </div>

        <ExpiredEmailForm />

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    );
  }

  if (error === 'send-failed') {
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) redirect({ href: '/signup', locale });
      if (user && user.emailVerified != null) redirect({ href: '/catalog', locale });
    }

    const resendWithEmail = email ? resendVerificationAction.bind(null, email) : null;
    return (
      <div className="w-full max-w-sm animate-fade-in-up space-y-10">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <WarningIcon />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
              {t('sendFailedHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{t('sendFailedBody')}</p>
          </div>
        </div>

        {resendWithEmail ? (
          <ResendForm action={resendWithEmail} email={email!} />
        ) : (
          <Link
            href="/signup"
            className="kinetic-gradient block w-full cursor-pointer rounded-md py-4 text-center text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97]"
          >
            {t('backToSignUp')}
          </Link>
        )}

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    );
  }

  if (error === 'invalid' || error === 'server') {
    const heading = error === 'server' ? t('serverHeading') : t('invalidHeading');
    const message = error === 'server' ? t('serverBody') : t('invalidBody');

    return (
      <div className="w-full max-w-sm animate-fade-in-up space-y-10">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <WarningIcon />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
              {heading}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{message}</p>
          </div>
        </div>

        <Link
          href="/signup"
          className="kinetic-gradient block w-full cursor-pointer rounded-md py-4 text-center text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97]"
        >
          {t('backToSignUp')}
        </Link>

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    );
  }

  redirect({ href: '/signup', locale });
}
