'use client';

import { Link } from '@/i18n/navigation';

type Props = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AdminError({ error, unstable_retry }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        fontFamily: 'var(--font-manrope)',
      }}
    >
      <div
        style={{
          background: '#1b1b1b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '48px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '16px',
          }}
        >
          Admin Panel
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '28px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.87)',
            marginBottom: '12px',
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            marginBottom: error.digest ? '8px' : '0',
          }}
        >
          An unexpected error occurred in the admin panel.
        </p>

        {error.digest && (
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            ref: {error.digest}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          <button
            type="button"
            onClick={unstable_retry}
            style={{
              background: '#dcb8ff',
              border: 'none',
              borderRadius: '8px',
              color: '#0d0d0d',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 24px',
              fontFamily: 'var(--font-manrope)',
            }}
          >
            Try again
          </button>

          <Link
            href="/admin"
            style={{
              display: 'block',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 24px',
              fontFamily: 'var(--font-manrope)',
              textDecoration: 'none',
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
