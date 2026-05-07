'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Lock, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/i18n/navigation';
import { Input } from '@/shared/components/ui/input';

import { changePasswordAction, updateProfileAction } from '../actions';
import { changePasswordSchema, profileNameSchema } from '../lib/validation';
import type { ChangePasswordFormValues, ProfileNameFormValues } from '../lib/validation';

import AvatarUpload from './AvatarUpload';

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 8s2.667-5 7-5 7 5 7 5-2.667 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 2l12 12" />
      <path d="M6.5 6.5a2 2 0 002.83 2.83" />
      <path d="M4 4.3A8 8 0 001 8s2.667 5 7 5c1.1 0 2.1-.25 3-.7" />
      <path d="M12 11.7A8 8 0 0015 8s-2.667-5-7-5c-1.1 0-2.1.25-3 .7" />
    </svg>
  );
}

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ onKeyDown, onKeyUp, onBlur, error, type: _type, id, ...props }, ref) => {
    const t = useTranslations('profile');
    const [show, setShow] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const errorId = id ? `${id}-error` : undefined;

    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            className="pr-10 placeholder:text-on-surface-variant/40"
            aria-describedby={error && errorId ? errorId : undefined}
            aria-invalid={!!error}
            onKeyDown={(e) => {
              setCapsLock(e.getModifierState('CapsLock'));
              onKeyDown?.(e);
            }}
            onKeyUp={(e) => {
              setCapsLock(e.getModifierState('CapsLock'));
              onKeyUp?.(e);
            }}
            onBlur={(e) => {
              setCapsLock(false);
              onBlur?.(e);
            }}
            {...props}
          />
          <button
            type="button"
            aria-label={show ? t('hidePassword') : t('showPassword')}
            aria-pressed={show}
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-outline-variant transition-colors hover:text-on-surface focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {capsLock && (
          <p role="status" className="mt-1.5 text-xs tracking-wide text-primary/70">
            {t('capsLockOn')}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';

type SettingsFormProps = {
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  location: string | null;
  email: string | null;
  hasPassword: boolean;
};

export default function SettingsForm({
  firstName,
  lastName,
  image,
  location,
  email,
  hasPassword,
}: SettingsFormProps) {
  const t = useTranslations('profile');
  const router = useRouter();
  const { update } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profileForm = useForm<ProfileNameFormValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: {
      firstName: firstName ?? '',
      lastName: lastName ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function handleDiscard() {
    router.push('/profile');
  }

  const handleSave = profileForm.handleSubmit(async (profileValues) => {
    setIsPending(true);
    setProfileError(null);

    try {
      const profileResult = await updateProfileAction({
        firstName: profileValues.firstName,
        lastName: profileValues.lastName,
      });

      if (!profileResult.success) {
        setProfileError(profileResult.error);
        return;
      }

      const preCheck = passwordForm.getValues();
      if (preCheck.currentPassword || preCheck.newPassword || preCheck.confirmPassword) {
        const isPasswordValid = await passwordForm.trigger();
        if (!isPasswordValid) return;

        const { currentPassword, newPassword } = passwordForm.getValues();
        const passwordResult = await changePasswordAction({ currentPassword, newPassword });
        if (!passwordResult.success) {
          passwordForm.setError('currentPassword', { message: passwordResult.error });
          return;
        }
      }

      const newName =
        [profileValues.firstName, profileValues.lastName].filter(Boolean).join(' ') || null;
      await update({ name: newName });
      router.refresh();
      router.push('/profile');
    } catch {
      setProfileError(t('genericError'));
    } finally {
      setIsPending(false);
    }
  });

  const watchedFirstName = profileForm.watch('firstName');
  const watchedLastName = profileForm.watch('lastName');
  const displayName =
    [watchedFirstName, watchedLastName].filter(Boolean).join(' ') || t('anonymous');

  return (
    <form onSubmit={handleSave} className="space-y-8 p-6 md:p-12">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-tight text-primary lowercase md:text-5xl">
          {t('settingsHeading')}
        </h1>
        <p className="text-lg text-on-surface-variant">{t('settingsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Profile block */}
        <section className="col-span-12 flex flex-col items-center space-y-6 rounded-2xl bg-surface-low p-8 text-center lg:col-span-4">
          <AvatarUpload currentImage={image} onUploadSuccess={() => router.refresh()} />
          <div className="space-y-2">
            <p className="font-display text-xl text-on-surface capitalize">{displayName}</p>
            {email && <p className="text-sm text-on-surface-variant">{email}</p>}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary-container/50 px-3 py-1.5 text-xs tracking-widest text-on-secondary-container uppercase ring-1 ring-outline-variant/15">
              <BadgeCheck size={14} aria-hidden="true" />
              {t('eliteMember')}
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="col-span-12 space-y-6 rounded-2xl bg-surface-low p-8 lg:col-span-8">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <User size={20} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-lg text-on-surface">{t('personalInfo')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="firstName"
                className="text-xs tracking-widest text-on-surface-variant uppercase"
              >
                {t('settingsFirstNameLabel')}
              </label>
              <Input
                id="firstName"
                {...profileForm.register('firstName')}
                placeholder={t('settingsFirstNamePlaceholder')}
                aria-invalid={!!profileForm.formState.errors.firstName}
                aria-describedby={
                  profileForm.formState.errors.firstName ? 'firstName-error' : undefined
                }
                className="placeholder:text-on-surface-variant/40"
              />
              {profileForm.formState.errors.firstName && (
                <p id="firstName-error" role="alert" className="text-sm text-destructive">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="lastName"
                className="text-xs tracking-widest text-on-surface-variant uppercase"
              >
                {t('settingsLastNameLabel')}
              </label>
              <Input
                id="lastName"
                {...profileForm.register('lastName')}
                placeholder={t('settingsLastNamePlaceholder')}
                aria-invalid={!!profileForm.formState.errors.lastName}
                aria-describedby={
                  profileForm.formState.errors.lastName ? 'lastName-error' : undefined
                }
                className="placeholder:text-on-surface-variant/40"
              />
              {profileForm.formState.errors.lastName && (
                <p id="lastName-error" role="alert" className="text-sm text-destructive">
                  {profileForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label
                htmlFor="location"
                className="text-xs tracking-widest text-on-surface-variant uppercase"
              >
                {t('settingsLocationLabel')}
              </label>
              <Input
                id="location"
                readOnly
                value={location ?? ''}
                placeholder={t('settingsLocationPlaceholder')}
                aria-describedby="location-hint"
                className="cursor-default opacity-50 placeholder:text-on-surface-variant/40"
              />
              <p id="location-hint" className="text-xs text-on-surface-variant/60">
                {t('settingsLocationHint')}
              </p>
            </div>
          </div>
          {profileError && (
            <p role="alert" className="text-sm text-destructive">
              {profileError}
            </p>
          )}
        </section>

        {/* Security */}
        {hasPassword && (
          <section className="col-span-12 space-y-6 rounded-2xl bg-surface-low p-8">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
              <Lock size={20} className="text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg text-on-surface">{t('securitySection')}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="currentPassword"
                  className="text-xs tracking-widest text-on-surface-variant uppercase"
                >
                  {t('currentPasswordLabel')}
                </label>
                <PasswordField
                  id="currentPassword"
                  {...passwordForm.register('currentPassword')}
                  placeholder={t('currentPasswordPlaceholder')}
                  error={passwordForm.formState.errors.currentPassword?.message}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="newPassword"
                  className="text-xs tracking-widest text-on-surface-variant uppercase"
                >
                  {t('newPasswordLabel')}
                </label>
                <PasswordField
                  id="newPassword"
                  {...passwordForm.register('newPassword')}
                  placeholder={t('newPasswordPlaceholder')}
                  error={passwordForm.formState.errors.newPassword?.message}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs tracking-widest text-on-surface-variant uppercase"
                >
                  {t('confirmPasswordLabel')}
                </label>
                <PasswordField
                  id="confirmPassword"
                  {...passwordForm.register('confirmPassword')}
                  placeholder={t('confirmPasswordPlaceholder')}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                />
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="col-span-12 flex flex-col justify-end gap-4 lg:flex-row">
          <button
            type="button"
            onClick={handleDiscard}
            className="order-1 cursor-pointer rounded-lg border border-outline-variant/20 px-8 py-3 font-display font-bold text-primary lowercase transition-all duration-200 hover:bg-surface-container hover:text-on-surface active:scale-95 lg:order-first"
          >
            {t('discardButton')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="kinetic-gradient cursor-pointer rounded-lg px-8 py-3 font-display text-sm font-semibold tracking-wide text-on-primary-container lowercase transition-transform duration-150 active:scale-95 disabled:opacity-50"
          >
            {isPending ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </div>
    </form>
  );
}
