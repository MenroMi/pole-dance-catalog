'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';

import { Link } from '@/i18n/navigation';
import LocaleSwitcher from '@/shared/components/LocaleSwitcher';

type Section = 'dashboard' | 'moves' | 'users' | 'tags';

interface AdminShellProps {
  children: React.ReactNode;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  currentUserName?: string | null;
}

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    Grid: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
    Play: <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />,
    Users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    Tag: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    BarChart: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    Search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    Bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    ChevronRight: <polyline points="9 18 15 12 9 6" />,
    ArrowLeft: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const NAV_ITEMS: { key: Section; icon: string }[] = [
  { key: 'dashboard', icon: 'Grid' },
  { key: 'moves', icon: 'Play' },
  { key: 'users', icon: 'Users' },
  { key: 'tags', icon: 'Tag' },
];

const SIDEBAR_KEY = 'admin-sidebar-collapsed';

export function AdminShell({
  children,
  activeSection,
  onSectionChange,
  currentUserName,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY) === 'true';
    const t = setTimeout(() => setCollapsed(stored), 0);
    return () => clearTimeout(t);
  }, []);
  const t = useTranslations('admin');

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(SIDEBAR_KEY, String(!c));
      return !c;
    });
  }

  const initials = currentUserName
    ? currentUserName
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0d0d0d',
        maxWidth: 2560,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#0e0e0e',
          borderRight: '1px solid rgba(75,68,80,0.3)',
          display: 'flex',
          flexDirection: 'column',
          transition:
            'width 280ms cubic-bezier(0.16,1,0.3,1), min-width 280ms cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
          zIndex: 20,
          boxShadow: '20px 0 40px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 20px' : '0 24px',
            borderBottom: '1px solid rgba(75,68,80,0.2)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#e2e2e2',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? (
              'ps'
            ) : (
              <>
                pole space<span style={{ color: '#dcb8ff' }}>.</span>
              </>
            )}
          </span>
          {!collapsed && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#8458b3',
                background: 'rgba(132,88,179,0.15)',
                padding: '2px 7px',
                borderRadius: 3,
              }}
            >
              admin
            </span>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV_ITEMS.map(({ key, icon }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => onSectionChange(key)}
                title={collapsed ? t(`nav.${key}`) : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '11px 0' : '11px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'rgba(220,184,255,0.10)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: active ? '#dcb8ff' : '#978e9b',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 180ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#e2e2e2';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = active ? '#dcb8ff' : '#978e9b';
                  e.currentTarget.style.background = active
                    ? 'rgba(220,184,255,0.10)'
                    : 'transparent';
                }}
              >
                <span style={{ flexShrink: 0 }}>
                  <NavIcon name={icon} size={16} />
                </span>
                {!collapsed && <span>{t(`nav.${key}`)}</span>}
                {!collapsed && active && (
                  <span style={{ marginLeft: 'auto', color: 'rgba(220,184,255,0.4)' }}>
                    <NavIcon name="ChevronRight" size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Back to catalog */}
        <div style={{ padding: '0 10px 8px', flexShrink: 0 }}>
          <Link
            href="/catalog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              color: '#6b6270',
              fontFamily: 'var(--font-manrope)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 150ms, background 150ms',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#e2e2e2';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#6b6270';
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            }}
          >
            <span style={{ flexShrink: 0 }}>
              <NavIcon name="ArrowLeft" size={15} />
            </span>
            {!collapsed && <span>{t('nav.backToCatalog')}</span>}
          </Link>
        </div>

        {/* Bottom: current admin user */}
        <div
          style={{
            padding: '12px 10px 20px',
            borderTop: '1px solid rgba(75,68,80,0.2)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg,#52416c,#dcb8ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 12,
                fontWeight: 700,
                color: '#1b1b1b',
              }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#e2e2e2',
                    fontFamily: 'var(--font-manrope)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUserName || 'Admin'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#8458b3',
                    fontFamily: 'var(--font-manrope)',
                    fontWeight: 700,
                  }}
                >
                  Admin
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px 0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            flexShrink: 0,
            background: 'rgba(13,13,13,0.85)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(75,68,80,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={toggleCollapsed}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#978e9b',
                cursor: 'pointer',
                display: 'flex',
                padding: 6,
                borderRadius: 6,
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e2e2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#978e9b';
              }}
            >
              <NavIcon name="BarChart" size={18} />
            </button>
            <span
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 20,
                fontWeight: 600,
                color: '#e2e2e2',
                letterSpacing: '-0.02em',
              }}
            >
              {t(`nav.${activeSection}`).toLowerCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
