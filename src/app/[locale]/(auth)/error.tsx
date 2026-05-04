'use client';
import { useTranslations } from 'next-intl';

type Props = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AuthError({ error, unstable_retry }: Props) {
  const t = useTranslations('errors.unexpected');

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-outline uppercase">
          {t('badge')}
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight text-on-surface lowercase">
          {t('heading')}
        </h1>
        <p className="text-sm leading-relaxed text-on-surface-variant">{t('message')}</p>

        {error.digest && <p className="font-mono text-xs text-outline">ref: {error.digest}</p>}
      </div>

      <button
        onClick={unstable_retry}
        className="kinetic-gradient w-full rounded-md px-6 py-3 text-xs font-bold tracking-widest text-on-primary uppercase transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
      >
        {t('retry')}
      </button>
    </div>
  );
}
