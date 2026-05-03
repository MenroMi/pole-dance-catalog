'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { RESEND_COOLDOWN_S } from '@/features/auth';
import { checkEmailVerifiedAction } from '@/features/auth/actions';

function SubmitButton({ remaining }: { remaining: number }) {
  const { pending } = useFormStatus();
  const blocked = pending || remaining > 0;

  return (
    <button
      type="submit"
      disabled={blocked}
      className="kinetic-gradient w-full cursor-pointer rounded-md py-4 text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending
        ? 'sending...'
        : remaining > 0
          ? `resend in ${remaining}s`
          : 'resend verification email'}
    </button>
  );
}

type Props = { action: () => Promise<void>; initialRemaining?: number; email: string };

export function ResendForm({ action, initialRemaining = 0, email }: Props) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (initialRemaining > 0) startCountdown(initialRemaining);
    return () => clearInterval(intervalRef.current);
  }, [initialRemaining]);

  useEffect(() => {
    async function checkAndRedirect() {
      if (redirectingRef.current) return;
      try {
        const verified = await checkEmailVerifiedAction(email);
        if (verified && !redirectingRef.current) {
          redirectingRef.current = true;
          router.replace('/catalog');
        }
      } catch {
        // network error — polling will retry in 5 s
      }
    }

    async function handleVisibilityChange() {
      if (document.visibilityState === 'visible') await checkAndRedirect();
    }

    const pollInterval = setInterval(checkAndRedirect, 5000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [email, router]);

  function startCountdown(seconds: number) {
    clearInterval(intervalRef.current);
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleAction() {
    const alreadyVerified = await checkEmailVerifiedAction(email);
    if (alreadyVerified) {
      router.replace('/catalog');
      return;
    }
    startCountdown(RESEND_COOLDOWN_S);
    await action();
  }

  return (
    <form action={handleAction}>
      <SubmitButton remaining={remaining} />
    </form>
  );
}
