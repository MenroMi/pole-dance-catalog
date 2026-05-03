'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { resetPasswordAction } from '@/features/auth/actions';
import { applyPasswordComplexity } from '@/features/auth/lib/validation';
import { PasswordInput } from '@/shared/components/PasswordInput';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .superRefine(applyPasswordComplexity),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [actionError, setActionError] = useState<'expired' | 'invalid' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setActionError(null);
    const result = await resetPasswordAction(token, data.password);
    if ('error' in result) {
      setActionError(result.error as 'expired' | 'invalid');
      return;
    }
    router.push('/login?reset=true');
  };

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          new password.
        </h2>
        <p className="text-sm text-on-surface-variant">
          choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div className="group">
            <label
              htmlFor="password"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              new password
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

          <div className="group">
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
            >
              confirm password
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p
                id="confirm-error"
                role="alert"
                className="mt-1.5 text-xs tracking-wide text-red-400/80"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {actionError === 'expired' && (
          <p role="alert" className="text-sm text-red-400">
            that link has expired.{' '}
            <Link href="/forgot-password" className="underline hover:text-red-300">
              request a new one
            </Link>
          </p>
        )}
        {actionError === 'invalid' && (
          <p role="alert" className="text-sm text-red-400">
            this link is invalid or already used.{' '}
            <Link href="/forgot-password" className="underline hover:text-red-300">
              request a new one
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting ? 'resetting...' : 'reset password'}
        </button>
      </form>

      <Link
        href="/login"
        className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
      >
        back to sign in
      </Link>
    </div>
  );
}
