'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getAdminStatsAction } from '../actions';
import { DIFFICULTY_COLORS } from '../constants';
import type { AdminStats } from '../types';

export function AdminDashboard() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStatsAction()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 12,
          padding: '24px 28px',
          color: '#f87171',
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: t('dashboard.totalMoves'), value: stats.totalMoves },
    { label: t('dashboard.totalUsers'), value: stats.totalUsers },
    { label: t('dashboard.totalTags'), value: stats.totalTags },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {statCards.map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: '#1a1a1a',
              borderRadius: 12,
              padding: '24px 28px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>{label}</div>
            <div style={{ color: '#dcb8ff', fontSize: 36, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2
          style={{
            color: '#e0e0e0',
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {t('dashboard.recentMoves')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.recentMoves.map((move) => (
            <div
              key={move.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
              }}
            >
              <span style={{ color: '#e0e0e0', fontSize: 14 }}>{move.title_en}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.08)',
                  color: DIFFICULTY_COLORS[move.difficulty] ?? '#e0e0e0',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                {move.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
