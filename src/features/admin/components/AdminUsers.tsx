'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';

import { changeUserRoleAction, getUsersForAdminAction } from '../actions';
import type { AdminUserRow } from '../types';

export function AdminUsers() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsersForAdminAction()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleRoleChange(userId: string, role: 'USER' | 'ADMIN') {
    setChangingRole(userId);
    try {
      await changeUserRoleAction(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (e) {
      console.error(e);
    } finally {
      setChangingRole(null);
    }
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          [u.firstName, u.lastName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : users;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('users.search')}
          style={{
            flex: 1,
            minWidth: 200,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e0e0e0',
            borderRadius: 8,
          }}
        />
        <span style={{ color: '#666', fontSize: 13, whiteSpace: 'nowrap' }}>
          {filtered.length} / {users.length}
        </span>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            color: '#f87171',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
          <button
            onClick={refresh}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 120px',
            gap: 16,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#666',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t('users.cols.email')}</span>
          <span>{t('users.cols.name')}</span>
          <span>{t('users.cols.joined')}</span>
          <span>{t('users.cols.role')}</span>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
            {t('users.noUsers')}
          </div>
        )}

        {!loading &&
          filtered.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 120px',
                gap: 16,
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: '#e0e0e0',
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </span>
              <span style={{ color: '#888', fontSize: 13 }}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
              </span>
              <span style={{ color: '#666', fontSize: 12 }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={changingRole === user.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: `1px solid ${user.role === 'ADMIN' ? '#dcb8ff' : 'rgba(255,255,255,0.15)'}`,
                    background: user.role === 'ADMIN' ? 'rgba(220,184,255,0.12)' : 'transparent',
                    color: user.role === 'ADMIN' ? '#dcb8ff' : '#888',
                    cursor: changingRole === user.id ? 'wait' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  asChild={false}
                >
                  {changingRole === user.id ? '...' : user.role} ▾
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  style={{
                    background: '#222',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                >
                  {user.role !== 'ADMIN' && (
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, 'ADMIN')}
                      style={{ color: '#dcb8ff', cursor: 'pointer' }}
                    >
                      {t('users.makeAdmin')}
                    </DropdownMenuItem>
                  )}
                  {user.role !== 'USER' && (
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, 'USER')}
                      style={{ color: '#e0e0e0', cursor: 'pointer' }}
                    >
                      {t('users.makeUser')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
      </div>
    </div>
  );
}
