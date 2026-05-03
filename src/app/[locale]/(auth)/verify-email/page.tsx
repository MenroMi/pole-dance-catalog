import Link from 'next/link';
import { redirect } from 'next/navigation';

import { resendVerificationAction } from '@/features/auth';
import { getResendCooldownRemaining } from '@/features/auth/lib/cooldown';
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

async function requireUnverifiedUser(email: string | undefined): Promise<string> {
  if (!email) redirect('/signup');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect('/signup');
  if (user.emailVerified !== null) redirect('/catalog');
  return email;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { sent, error, email } = await searchParams;

  if (sent) {
    const validEmail = await requireUnverifiedUser(email);

    // Token must exist and not be expired — otherwise redirect to expired state
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: validEmail },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.expires < new Date()) {
      redirect('/verify-email?error=expired');
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
              check your inbox.
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              we sent a verification link to your email. it expires in 24 hours.
            </p>
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
            back to sign in
          </Link>
        </div>

        <div className="border-t border-outline-variant/15 pt-2">
          <p className="text-[10px] tracking-widest text-outline uppercase">
            didn&apos;t get an email? check your spam folder
          </p>
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
              link expired.
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              your verification link has expired. enter your email to get a new one.
            </p>
          </div>
        </div>

        <ExpiredEmailForm />

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          back to sign in
        </Link>
      </div>
    );
  }

  if (error === 'send-failed') {
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) redirect('/signup');
      if (user.emailVerified != null) redirect('/catalog');
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
              couldn&apos;t send email.
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              we failed to deliver your verification email. please try again.
            </p>
          </div>
        </div>

        {resendWithEmail ? (
          <ResendForm action={resendWithEmail} email={email!} />
        ) : (
          <Link
            href="/signup"
            className="kinetic-gradient block w-full cursor-pointer rounded-md py-4 text-center text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97]"
          >
            back to sign up
          </Link>
        )}

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          back to sign in
        </Link>
      </div>
    );
  }

  if (error === 'invalid' || error === 'server') {
    const heading = error === 'server' ? 'something went wrong.' : 'invalid link.';
    const message =
      error === 'server'
        ? 'we could not verify your email. please try again later.'
        : 'this verification link is invalid. please sign up again.';

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
          back to sign up
        </Link>

        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          already have an account? sign in
        </Link>
      </div>
    );
  }

  redirect('/signup');
}
