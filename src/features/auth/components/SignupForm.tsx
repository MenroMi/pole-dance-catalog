'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { PasswordInput } from '@/shared/components/PasswordInput';

import { signupAction } from '../actions';
import { signupSchema } from '../lib/validation';
import type { SignupFormData } from '../lib/validation';

import { FacebookIcon, GoogleIcon } from './SocialIcons';

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const te = useTranslations('auth.errors');
  const [detectedLocation, setDetectedLocation] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
        if (!res.ok) return;
        const data = (await res.json()) as { location?: string | null };
        if (data.location) setDetectedLocation(data.location);
      } catch {
        // silent — location is optional
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    const result = await signupAction({
      ...data,
      ...(detectedLocation ? { location: detectedLocation } : {}),
    });
    if (result?.error) {
      setError('root', { message: result.error });
    }
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          {t('title')}
        </h2>
        <p className="text-sm text-on-surface-variant">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          {/* First Name */}
          <div className="group">
            <label
              htmlFor="firstName"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('firstNameLabel')}
            </label>
            <div className="relative">
              <input
                id="firstName"
                type="text"
                placeholder="your first name"
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.firstName && (
              <p
                id="firstName-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="group">
            <label
              htmlFor="lastName"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('lastNameLabel')}
            </label>
            <div className="relative">
              <input
                id="lastName"
                type="text"
                placeholder="your last name"
                className="w-full border-b border-outline-variant bg-transparent px-0 py-3 text-on-surface placeholder:text-outline-variant/40 focus:outline-none"
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>
            {errors.lastName && (
              <p
                id="lastName-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.lastName.message}
              </p>
            )}
          </div>

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
            <label
              htmlFor="password"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              {t('passwordLabel')}
            </label>
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
            {(
              {
                'Too many requests': te('tooManyRequests'),
                'Invalid input': te('invalidInput'),
                'Email already in use': te('emailAlreadyInUse'),
                'Failed to send email, please try again': te('sendEmailFailed'),
              } as Record<string, string>
            )[errors.root.message] ?? errors.root.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0"
          >
            <GoogleIcon />
            google
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container px-4 py-3 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-high hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] active:translate-y-0"
          >
            <FacebookIcon />
            facebook
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="ml-1 font-bold text-primary decoration-2 underline-offset-4 hover:underline"
        >
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
