'use client';
import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ onKeyDown, onKeyUp, onBlur, className, type: _type, ...props }, ref) => {
    const t = useTranslations('common');
    const [show, setShow] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    return (
      <>
        <div className="relative">
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={cn(
              'w-full border-b border-outline-variant bg-transparent px-0 py-3 pr-8 text-on-surface placeholder:text-outline-variant/40 focus:outline-none',
              className,
            )}
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
          <div className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-center scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
          <button
            type="button"
            aria-label={show ? t('hidePassword') : t('showPassword')}
            aria-pressed={show}
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-0 -translate-y-1/2 text-outline-variant transition-colors hover:text-on-surface focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {capsLock && (
          <p role="status" className="mt-1.5 text-xs tracking-wide text-primary/70">
            {t('capsLockOn')}
          </p>
        )}
      </>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

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
