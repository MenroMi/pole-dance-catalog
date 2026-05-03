'use client';
import { useTransition } from 'react';

import { resendVerificationAction } from '@/features/auth';

export function ExpiredEmailForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email') as string;
    startTransition(async () => {
      await resendVerificationAction(email);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        disabled={isPending}
        className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isPending}
        className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isPending ? 'sending...' : 'resend verification email'}
      </button>
    </form>
  );
}
