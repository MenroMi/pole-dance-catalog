'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getAdminStatsAction } from '../actions';
import type { AdminStats } from '../types';

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    Users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    Play: <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />,
    Activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    Heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    Tag: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    Award: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    TrendingUp: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    ChevronRight: <polyline points="9 18 15 12 9 6" />,
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

const DIFF_COLORS: Record<string, { bg: string; fg: string }> = {
  BEGINNER: { bg: 'rgba(132,209,153,0.16)', fg: '#84d099' },
  INTERMEDIATE: { bg: 'rgba(132,88,179,0.20)', fg: '#c5afe2' },
  ADVANCED: { bg: 'rgba(251,191,36,0.14)', fg: '#fbbf24' },
};

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  accent?: string;
  trend?: 'up';
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#1f1f1f' : '#1b1b1b',
        border: hov ? '1px solid rgba(220,184,255,0.25)' : '1px solid rgba(75,68,80,0.2)',
        borderRadius: 12,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 200ms ease',
        boxShadow: hov ? '0 4px 24px -4px rgba(132,88,179,0.25)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#978e9b',
            fontFamily: 'var(--font-manrope)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: accent || '#dcb8ff',
            opacity: hov ? 1 : 0.5,
            display: 'flex',
            transition: 'opacity 200ms',
          }}
        >
          <NavIcon name={icon} size={18} />
        </span>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 40,
            fontWeight: 700,
            color: '#e2e2e2',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 12,
              color: trend === 'up' ? '#84d099' : '#978e9b',
              fontFamily: 'var(--font-manrope)',
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {trend === 'up' && <NavIcon name="TrendingUp" size={12} />}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const WEEK_DATA = [
  { day: 'Mon', users: 12, moves: 2 },
  { day: 'Tue', users: 19, moves: 3 },
  { day: 'Wed', users: 8, moves: 1 },
  { day: 'Thu', users: 24, moves: 4 },
  { day: 'Fri', users: 31, moves: 2 },
  { day: 'Sat', users: 15, moves: 1 },
  { day: 'Sun', users: 22, moves: 3 },
];

function ActivityChart() {
  const t = useTranslations('admin');
  const max = Math.max(...WEEK_DATA.map((d) => d.users));
  return (
    <div
      style={{
        background: '#1b1b1b',
        border: '1px solid rgba(75,68,80,0.2)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#978e9b',
              fontFamily: 'var(--font-manrope)',
              marginBottom: 4,
            }}
          >
            {t('dashboard.weeklyActivity')}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 22,
              fontWeight: 600,
              color: '#e2e2e2',
              letterSpacing: '-0.02em',
            }}
          >
            {t('dashboard.activeUsers')}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#978e9b',
            fontFamily: 'var(--font-manrope)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: '#8458b3',
              display: 'inline-block',
            }}
          />
          {t('dashboard.usersLegend')}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: 'rgba(220,184,255,0.4)',
              display: 'inline-block',
              marginLeft: 8,
            }}
          />
          {t('dashboard.movesAddedLegend')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
        {WEEK_DATA.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                height: 88,
                justifyContent: 'flex-end',
              }}
            >
              {d.moves > 0 && (
                <div
                  style={{
                    width: '100%',
                    height: `${(d.moves / 5) * 100}%`,
                    maxHeight: 24,
                    background: 'rgba(220,184,255,0.35)',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
              <div
                style={{
                  width: '100%',
                  height: `${(d.users / max) * 80}%`,
                  background: 'linear-gradient(180deg,#8458b3,#52416c)',
                  borderRadius: '3px 3px 0 0',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#dcb8ff',
                    fontFamily: 'var(--font-manrope)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.users}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#978e9b',
                fontFamily: 'var(--font-manrope)',
                fontWeight: 600,
              }}
            >
              {d.day}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStatsAction()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : t('dashboard.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return <div style={{ color: '#978e9b', padding: 40, textAlign: 'center' }}>{t('loading')}</div>;
  }

  if (error || !stats) {
    return (
      <div
        style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 12,
          padding: '16px 20px',
          color: '#f87171',
          margin: 32,
        }}
      >
        {error ?? t('dashboard.loadError')}
      </div>
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: 1200 }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#4b4450',
            fontFamily: 'var(--font-manrope)',
            marginBottom: 8,
          }}
        >
          {monthLabel} · v.0.1
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#e2e2e2',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {t('dashboard.greeting')}{' '}
          <em style={{ color: '#dcb8ff', fontStyle: 'italic', fontWeight: 500 }}>
            {t('dashboard.greetingAdmin')}
          </em>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 14,
            color: '#978e9b',
            margin: '10px 0 0',
          }}
        >
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Stat grid — row 1 (4 cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <StatCard
          label={t('dashboard.totalUsers')}
          value={stats.totalUsers}
          sub={`+23 ${t('dashboard.thisWeek')}`}
          trend="up"
          icon="Users"
        />
        <StatCard
          label={t('dashboard.totalMoves')}
          value={stats.totalMoves}
          sub={t('dashboard.acrossCategories')}
          icon="Play"
        />
        <StatCard
          label={t('dashboard.activeToday')}
          value="—"
          sub={`94 ${t('dashboard.sessionsOpen')}`}
          trend="up"
          icon="Activity"
        />
        <StatCard
          label={t('dashboard.favourited')}
          value="—"
          sub={t('dashboard.acrossAllMoves')}
          trend="up"
          icon="Heart"
          accent="#dcb8ff"
        />
      </div>

      {/* Stat grid — row 2 (3 cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <StatCard
          label={t('dashboard.totalTags')}
          value={stats.totalTags}
          sub={t('dashboard.acrossCatalog')}
          icon="Tag"
          accent="#84d099"
        />
        <StatCard
          label={t('dashboard.progressRecords')}
          value="—"
          sub={t('dashboard.userMovieLinks')}
          icon="Award"
          accent="#fbbf24"
        />
        <StatCard
          label={t('dashboard.newUsers')}
          value="—"
          sub={t('dashboard.thisWeek')}
          trend="up"
          icon="TrendingUp"
          accent="#c5afe2"
        />
      </div>

      {/* Chart + recent moves */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18 }}>
        <ActivityChart />

        {/* Recent moves */}
        <div
          style={{
            background: '#1b1b1b',
            border: '1px solid rgba(75,68,80,0.2)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#978e9b',
                  fontFamily: 'var(--font-manrope)',
                  marginBottom: 4,
                }}
              >
                {t('moves.catalog')}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#e2e2e2',
                  letterSpacing: '-0.02em',
                }}
              >
                {t('dashboard.recentMovesSection')}
              </div>
            </div>
          </div>
          {stats.recentMoves.map((m, i) => {
            const dc = DIFF_COLORS[m.difficulty] ?? DIFF_COLORS.BEGINNER;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 0',
                  borderTop: i > 0 ? '1px solid rgba(75,68,80,0.15)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    flexShrink: 0,
                    background: 'linear-gradient(135deg,#0e0e0e,#2a2a2a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(75,68,80,0.2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      fontSize: 16,
                      color: 'rgba(220,184,255,0.5)',
                    }}
                  >
                    ◇
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      fontSize: 14,
                      color: '#e2e2e2',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.title_en}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#978e9b',
                      fontFamily: 'var(--font-manrope)',
                      marginTop: 2,
                    }}
                  >
                    {m.category}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 9999,
                    background: dc.bg,
                    color: dc.fg,
                    fontFamily: 'var(--font-manrope)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.difficulty}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
