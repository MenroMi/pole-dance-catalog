import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Editorial side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-surface-lowest p-12 pb-10 lg:flex lg:w-3/5 xl:w-2/3">
        {/* Animated blobs */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] animate-blob-a rounded-full bg-primary-container/40 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] animate-blob-b rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-lowest/60 via-transparent to-transparent" />

        {/* Pole silhouette — thin vertical line centered */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, #978e9b 20%, #978e9b 80%, transparent 100%)',
            opacity: 0.15,
          }}
        />

        {/* Wordmark */}
        <Link
          href="/"
          className="relative z-10 font-display text-xl font-semibold tracking-tight text-on-surface lowercase"
        >
          pole space<span className="text-primary">.</span>
        </Link>

        {/* Editorial body */}
        <div className="relative z-10 max-w-xl space-y-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-outline uppercase">
            v.0.1 — kinetic gallery
          </p>
          <h1 className="font-display text-7xl leading-[0.95] font-bold tracking-tighter text-on-surface lowercase">
            A catalog of <em className="font-medium text-primary not-italic">every</em>&nbsp;move
            you&apos;ve ever wanted to learn.
          </h1>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[10px] font-semibold tracking-[0.18em] text-outline-variant uppercase">
          © 2026 pole space — for the kinetic gallery
        </p>
      </div>

      {/* Form side */}
      <main className="relative flex w-full flex-col items-center justify-center overflow-y-auto bg-surface px-8 py-16 sm:px-16 lg:w-2/5 xl:w-1/3">
        {/* Mobile brand */}
        <div className="absolute top-10 left-8 lg:hidden">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-on-surface lowercase"
          >
            pole space<span className="text-primary">.</span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
