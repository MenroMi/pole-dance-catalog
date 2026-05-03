'use client';

import Link from 'next/link';

type Props = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function MainError({ error, unstable_retry }: Props) {
  return (
    <div className="relative flex flex-1 items-center overflow-hidden px-8 py-16">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-container/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <div className="max-w-md space-y-5">
          <div className="inline-block rounded-full border border-outline-variant/15 bg-secondary-container/30 px-4 py-1">
            <span className="text-[10px] font-bold tracking-widest text-on-secondary-container uppercase">
              something went wrong
            </span>
          </div>

          <h1 className="font-display text-3xl font-medium tracking-tight text-on-surface lowercase md:text-5xl">
            unexpected error.
          </h1>

          <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">
            something broke on our end. try again — if it keeps happening, come back later.
          </p>

          {error.digest && <p className="font-mono text-xs text-outline">ref: {error.digest}</p>}

          <div className="flex flex-col gap-3 pt-6 sm:flex-row">
            <button
              onClick={unstable_retry}
              className="kinetic-gradient block rounded-md px-10 py-4 text-center text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97]"
            >
              try again
            </button>
            <Link
              href="/catalog"
              className="bg-surface-container-high hover:bg-surface-container-highest block rounded-md border border-outline-variant/20 px-10 py-4 text-center text-xs font-bold tracking-widest text-on-surface uppercase transition-all duration-200 active:scale-[0.97]"
            >
              back to catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
