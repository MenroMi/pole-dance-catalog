'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { forgotPasswordAction } from '@/features/auth/actions';

const schema = z.object({ email: z.string().email('Please enter a valid email') });
type FormData = z.infer<typeof schema>;

type ForgotPasswordFormProps = {
  sent: boolean;
  expired: boolean;
};

export default function ForgotPasswordForm({ sent, expired }: ForgotPasswordFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await forgotPasswordAction(data.email);
    if ('sent' in result) {
      router.push('/forgot-password?sent=true');
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm animate-fade-in-up space-y-10">
        <div className="space-y-1.5">
          <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
            check your inbox.
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            if that address is registered, a reset link is on its way. it expires in 1 hour.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center text-xs text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
        >
          back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-10">
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-light tracking-tight text-on-surface lowercase">
          forgot password.
        </h2>
        <p className="text-sm text-on-surface-variant">
          enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {expired && (
        <p role="alert" className="text-sm text-red-400">
          that link has expired — enter your email to get a new one.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="group">
          <label
            htmlFor="email"
            className="mb-1 block text-[10px] font-medium tracking-widest text-outline-variant uppercase transition-colors duration-200 group-focus-within:text-primary"
          >
            email address
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting ? 'sending...' : 'send reset link'}
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
