import Link from 'next/link';

import Header from '@/shared/components/Header';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-container/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10">
        <Header />
      </div>

      <main className="relative z-10 flex flex-1 items-center px-8 py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div>
            <div className="relative mb-6 select-none">
              <h1 className="[background-image:linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_50%,var(--color-surface-container-highest)_100%)] [background-clip:text] font-display text-[8rem] leading-none font-black tracking-tighter text-transparent opacity-75 [-webkit-background-clip:text] md:text-[14rem]">
                404
              </h1>
              <div className="absolute top-1/2 left-0 h-px w-full -rotate-1 bg-primary/20 blur-sm" />
            </div>

            <div className="max-w-md space-y-5">
              <div className="inline-block rounded-full border border-outline-variant/15 bg-secondary-container/30 px-4 py-1">
                <span className="text-[10px] font-bold tracking-widest text-on-secondary-container uppercase">
                  not found
                </span>
              </div>
              <h2 className="font-display text-3xl font-medium tracking-tight text-on-surface lowercase md:text-5xl">
                lost your momentum?
              </h2>
              <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">
                this move doesn&apos;t exist in our catalog yet, or the link has lost its grip.
              </p>
              <div className="flex flex-col gap-3 pt-6 sm:flex-row">
                <Link
                  href="/catalog"
                  className="kinetic-gradient block rounded-md px-10 py-4 text-center text-xs font-bold tracking-widest text-on-primary uppercase shadow-[0_4px_16px_-2px_rgba(132,88,179,0.4)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_6px_20px_-2px_rgba(220,184,255,0.5)] active:scale-[0.97]"
                >
                  back to gallery
                </Link>
                <Link
                  href="/"
                  className="bg-surface-container-high hover:bg-surface-container-highest block rounded-md border border-outline-variant/20 px-10 py-4 text-center text-xs font-bold tracking-widest text-on-surface uppercase transition-all duration-200 active:scale-[0.97]"
                >
                  go home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed top-1/2 right-8 hidden h-24 w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent md:block" />
    </div>
  );
}
