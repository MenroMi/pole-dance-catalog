'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Section = 'dashboard' | 'moves' | 'users' | 'tags';

interface AdminShellProps {
  children: React.ReactNode;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const NAV_ITEMS: { key: Section; label: string }[] = [
  { key: 'dashboard', label: '⊞' },
  { key: 'moves', label: '◈' },
  { key: 'users', label: '◉' },
  { key: 'tags', label: '⬡' },
];

export function AdminShell({ children, activeSection, onSectionChange }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations('admin');

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#e0e0e0' }}>
      <aside
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          background: '#141414',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 200ms ease',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            minHeight: 64,
          }}
        >
          {!collapsed && (
            <span style={{ color: '#dcb8ff', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
              Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav style={{ flex: 1, paddingTop: 8 }}>
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onSectionChange(key)}
              title={t(`nav.${key}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                background: activeSection === key ? 'rgba(220,184,255,0.1)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${activeSection === key ? '#dcb8ff' : 'transparent'}`,
                color: activeSection === key ? '#dcb8ff' : '#888',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                transition: 'all 150ms',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{label}</span>
              {!collapsed && <span>{t(`nav.${key}`)}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            height: 64,
            background: 'rgba(14,14,14,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <h1 style={{ color: '#e0e0e0', fontSize: 18, fontWeight: 600, margin: 0 }}>
            {t(`nav.${activeSection}`)}
          </h1>
        </header>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}
