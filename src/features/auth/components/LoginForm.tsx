'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { PasswordInput } from '@/shared/components/PasswordInput';

import { loginAction, signInWithOAuthAction } from '../actions';
import { loginSchema } from '../lib/validation';
import type { LoginFormData } from '../lib/validation';

import { FacebookIcon, GoogleIcon } from './SocialIcons';

const OAUTH_ERROR_MAP: Record<string, string> = {
  OAuthAccountNotLinked: 'oauthAccountNotLinked',
  OAuthCallbackError: 'oauthCallbackError',
  OAuthSignin: 'oauthSignin',
  AccountBlocked: 'accountBlocked',
};

const facebookEnabled = process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === 'true';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const te = useTranslations('auth.errors');
  const searchParams = useSearchParams();
  const showResetBanner = searchParams.get('reset') === 'true';
  const showVerifiedBanner = searchParams.get('verified') === 'true';
  const oauthErrorCode = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    const result = await loginAction(data);
    if (result?.error) {
      setError('root', { message: result.error });
      if (result.email) setUnverifiedEmail(result.email);
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'facebook') => {
    setPendingProvider(provider);
    startTransition(async () => {
      try {
        await signInWithOAuthAction(provider, callbackUrl);
      } finally {
        setPendingProvider(null);
      }
    });
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          {t('title')}
        </h2>
        <p className="text-sm text-on-surface-variant">{t('subtitle')}</p>
      </div>

      {showResetBanner && (
        <p
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/8 px-3.5 py-3 text-sm text-green-400"
        >
          {t('resetBanner')}
        </p>
      )}

      {showVerifiedBanner && (
        <p
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/8 px-3.5 py-3 text-sm text-green-400"
        >
          {t('verifiedBanner')}
        </p>
      )}

      {oauthErrorCode && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-400"
        >
          {te(OAUTH_ERROR_MAP[oauthErrorCode] ?? 'oauthGeneric')}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          {/* Email */}
          <div className="group">
            <label
              htmlFor="email"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('emailLabel')}
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="performer@polespace.com"
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="group">
            <div className="mb-1 flex items-end justify-between">
              <label
                htmlFor="password"
                className="block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
              >
                {t('passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] tracking-widest text-primary/60 uppercase transition-colors duration-200 hover:text-primary"
              >
                {t('forgot')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {errors.root && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-400"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {(
                {
                  'Invalid credentials': te('invalidCredentials'),
                  AccountBlocked: te('accountBlocked'),
                  'Please verify your email first': te('verifyEmailFirst'),
                  'Please sign in with Google or Facebook': te('pleaseSignInWithOAuth'),
                } as Record<string, string>
              )[errors.root.message ?? ''] ?? errors.root.message}
              {unverifiedEmail && (
                <>
                  {' — '}
                  <Link
                    href={`/verify-email?sent=true&email=${encodeURIComponent(unverifiedEmail)}`}
                    className="underline underline-offset-4 hover:text-red-300"
                  >
                    {t('resendVerificationLink')}
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient flex w-full cursor-pointer items-center justify-center gap-2 rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <div className="space-y-6">
        <div className="relative flex items-center">
          <div className="h-px grow bg-outline-variant/20" />
          <span className="mx-4 shrink text-[10px] tracking-widest text-outline-variant uppercase">
            {t('orContinueWith')}
          </span>
          <div className="h-px grow bg-outline-variant/20" />
        </div>

        {facebookEnabled ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('google')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingProvider === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {t('continueWithGoogle')}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleOAuthSignIn('facebook')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingProvider === 'facebook' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FacebookIcon />
              )}
              {t('continueWithFacebook')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleOAuthSignIn('google')}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingProvider === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {t('continueWithGoogle')}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        {t('noAccount')}{' '}
        <Link
          href="/signup"
          className="ml-1 font-bold text-primary decoration-2 underline-offset-4 hover:underline"
        >
          {t('createAccount')}
        </Link>
      </p>
    </div>
  );
}
