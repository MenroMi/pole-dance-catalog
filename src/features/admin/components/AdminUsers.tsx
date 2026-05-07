'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import {
  blockUserAction,
  changeUserRoleAction,
  deleteUserAction,
  getUsersForAdminAction,
  unblockUserAction,
} from '../actions';
import type { AdminUserRow } from '../types';

import { ConfirmDialog } from './ConfirmDialog';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN';

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    Search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    Shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    Ban: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </>
    ),
    RefreshCw: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </>
    ),
    Trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

const GRID = '2.5fr 1fr 80px 80px 1fr 120px';

const ROLE_STYLES: Record<string, { bg: string; fg: string }> = {
  ADMIN: { bg: 'rgba(220,184,255,0.15)', fg: '#dcb8ff' },
  USER: { bg: 'rgba(75,68,80,0.25)', fg: '#cdc3d2' },
};

interface ConfirmState {
  type: 'role' | 'block' | 'unblock' | 'delete';
  userId: string;
  title: string;
  body: string;
  label: string;
  danger: boolean;
  newRole?: 'USER' | 'ADMIN';
}

function UserRow({
  user,
  isLast,
  isSelf,
  onAction,
}: {
  user: AdminUserRow;
  isLast: boolean;
  isSelf: boolean;
  onAction: (type: ConfirmState['type'], user: AdminUserRow, newRole?: 'USER' | 'ADMIN') => void;
}) {
  const t = useTranslations('admin');
  const [hov, setHov] = useState(false);
  const isBlocked = Boolean(user.blockedAt);
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join('') || user.email[0].toUpperCase();
  const rs = ROLE_STYLES[user.role] ?? ROLE_STYLES.USER;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        padding: '13px 20px',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid rgba(75,68,80,0.12)',
        background: hov ? 'rgba(220,184,255,0.03)' : 'transparent',
        transition: 'background 150ms',
        position: 'relative',
        opacity: isBlocked ? 0.65 : 1,
      }}
    >
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg,#52416c,#dcb8ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 13,
            fontWeight: 700,
            color: '#1b1b1b',
            opacity: isBlocked ? 0.5 : 1,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              color: isBlocked ? '#6b6270' : '#e2e2e2',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.email}
          </div>
          {fullName && (
            <div
              style={{
                fontSize: 12,
                color: '#6b6270',
                fontFamily: 'var(--font-manrope)',
                marginTop: 1,
              }}
            >
              {fullName}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div
        style={{
          fontSize: 13,
          color: '#978e9b',
          fontFamily: 'var(--font-manrope)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {user.location || '—'}
      </div>

      {/* Moves (placeholder) */}
      <div
        style={{
          fontSize: 14,
          color: '#cdc3d2',
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 500,
        }}
      >
        —
      </div>

      {/* Joined */}
      <div style={{ fontSize: 12, color: '#6b6270', fontFamily: 'var(--font-manrope)' }}>
        {new Date(user.createdAt).toLocaleDateString().slice(0, 7)}
      </div>

      {/* Role & Status chips */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: 9999,
            fontFamily: 'var(--font-manrope)',
            background: rs.bg,
            color: rs.fg,
          }}
        >
          {user.role === 'ADMIN' ? t('users.roleAdmin') : t('users.roleUser')}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: 9999,
            fontFamily: 'var(--font-manrope)',
            background: isBlocked ? 'rgba(179,38,30,0.15)' : 'rgba(132,209,153,0.15)',
            color: isBlocked ? '#ef4444' : '#84d099',
          }}
        >
          {isBlocked ? t('users.blocked') : t('users.active')}
        </span>
      </div>

      {/* Actions (hover-reveal) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          opacity: hov && !isSelf ? 1 : 0.15,
          transition: 'opacity 150ms',
        }}
      >
        {/* Role toggle */}
        <button
          disabled={isSelf}
          onClick={() => onAction('role', user, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
          title={user.role === 'ADMIN' ? t('users.revokeAdmin') : t('users.makeAdmin')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: isSelf ? 'not-allowed' : 'pointer',
            display: 'flex',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!isSelf) {
              e.currentTarget.style.borderColor = '#dcb8ff';
              e.currentTarget.style.color = '#dcb8ff';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            e.currentTarget.style.color = '#978e9b';
          }}
        >
          <NavIcon name="Shield" size={13} />
        </button>

        {/* Block/Unblock toggle */}
        <button
          disabled={isSelf}
          onClick={() => onAction(isBlocked ? 'unblock' : 'block', user)}
          title={isBlocked ? t('users.unblock') : t('users.block')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: isSelf ? 'not-allowed' : 'pointer',
            display: 'flex',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!isSelf) {
              e.currentTarget.style.borderColor = isBlocked ? '#84d099' : '#ef4444';
              e.currentTarget.style.color = isBlocked ? '#84d099' : '#ef4444';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            e.currentTarget.style.color = '#978e9b';
          }}
        >
          <NavIcon name={isBlocked ? 'RefreshCw' : 'Ban'} size={13} />
        </button>

        {/* Delete */}
        <button
          disabled={isSelf}
          onClick={() => onAction('delete', user)}
          title={t('users.deleteUser')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: isSelf ? 'not-allowed' : 'pointer',
            display: 'flex',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!isSelf) {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            e.currentTarget.style.color = '#978e9b';
          }}
        >
          <NavIcon name="Trash" size={13} />
        </button>
      </div>
    </div>
  );
}

export function AdminUsers({ currentUserId }: { currentUserId: string | null }) {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUsersForAdminAction()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t('users.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAction(
    type: ConfirmState['type'],
    user: AdminUserRow,
    newRole?: 'USER' | 'ADMIN',
  ) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    if (type === 'role') {
      setConfirm({
        type,
        userId: user.id,
        newRole,
        title: t(newRole === 'ADMIN' ? 'users.grantAdminTitle' : 'users.revokeAdminTitle'),
        body: t(newRole === 'ADMIN' ? 'users.grantAdminBody' : 'users.revokeAdminBody', { name }),
        label: t(newRole === 'ADMIN' ? 'users.makeAdmin' : 'users.revokeAdmin'),
        danger: newRole !== 'ADMIN',
      });
    } else if (type === 'block') {
      setConfirm({
        type,
        userId: user.id,
        title: t('users.blockTitle'),
        body: t('users.blockBody', { name }),
        label: t('users.block'),
        danger: true,
      });
    } else if (type === 'unblock') {
      setConfirm({
        type,
        userId: user.id,
        title: t('users.unblockTitle'),
        body: t('users.unblockBody', { name }),
        label: t('users.unblock'),
        danger: false,
      });
    } else if (type === 'delete') {
      setConfirm({
        type,
        userId: user.id,
        title: t('users.deleteUser'),
        body: t('users.confirmDelete'),
        label: t('users.deleteUser'),
        danger: true,
      });
    }
  }

  async function applyConfirm() {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.type === 'role' && confirm.newRole) {
        await changeUserRoleAction(confirm.userId, confirm.newRole);
        setUsers((prev) =>
          prev.map((u) => (u.id === confirm.userId ? { ...u, role: confirm.newRole! } : u)),
        );
      } else if (confirm.type === 'block') {
        await blockUserAction(confirm.userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === confirm.userId ? { ...u, blockedAt: new Date() } : u)),
        );
      } else if (confirm.type === 'unblock') {
        await unblockUserAction(confirm.userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === confirm.userId ? { ...u, blockedAt: null } : u)),
        );
      } else if (confirm.type === 'delete') {
        await deleteUserAction(confirm.userId);
        setUsers((prev) => prev.filter((u) => u.id !== confirm.userId));
      }
      setConfirm(null);
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchQ =
      !query ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      [u.firstName, u.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchR = roleFilter === 'ALL' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const blockedCount = users.filter((u) => u.blockedAt).length;

  return (
    <div style={{ padding: '32px 40px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#6b6270',
            fontFamily: 'var(--font-manrope)',
            marginBottom: 8,
          }}
        >
          {t('users.community')} · {users.length} {t('users.members')} · {adminCount}{' '}
          {t('users.adminsCount')} · {blockedCount} {t('users.blocked')}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#e2e2e2',
            margin: 0,
          }}
        >
          {t('users.title').toLowerCase()}
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#1b1b1b',
            border: '1px solid rgba(75,68,80,0.3)',
            borderRadius: 8,
            padding: '8px 14px',
          }}
        >
          <span style={{ color: '#978e9b', display: 'flex' }}>
            <NavIcon name="Search" size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('users.search')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e2e2',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              outline: 'none',
              flex: 1,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'USER', 'ADMIN'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '7px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'var(--font-manrope)',
                border: 'none',
                transition: 'all 150ms',
                background:
                  roleFilter === r
                    ? r === 'ADMIN'
                      ? 'rgba(220,184,255,0.15)'
                      : 'rgba(220,184,255,0.10)'
                    : 'transparent',
                color: roleFilter === r ? (r === 'ADMIN' ? '#dcb8ff' : '#cdc3d2') : '#978e9b',
              }}
            >
              {r === 'ALL'
                ? t('users.filterAll')
                : r === 'ADMIN'
                  ? t('users.roleAdmin')
                  : t('users.roleUser')}
            </button>
          ))}
        </div>
        <span
          style={{
            color: '#6b6270',
            fontSize: 13,
            fontFamily: 'var(--font-manrope)',
            whiteSpace: 'nowrap',
          }}
        >
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
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: '#1b1b1b',
          borderRadius: 12,
          border: '1px solid rgba(75,68,80,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '10px 20px',
            borderBottom: '1px solid rgba(75,68,80,0.2)',
          }}
        >
          {[
            t('users.cols.user'),
            t('users.cols.location'),
            t('users.cols.moves'),
            t('users.cols.joined'),
            t('users.cols.roleStatus'),
            '',
          ].map((h, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#6b6270',
                fontFamily: 'var(--font-manrope)',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>{t('loading')}</div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: '#6b6270',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
            }}
          >
            {t('users.noUsers')}
          </div>
        )}

        {!loading &&
          filtered.map((user, i) => (
            <UserRow
              key={user.id}
              user={user}
              isLast={i === filtered.length - 1}
              isSelf={user.id === currentUserId}
              onAction={handleAction}
            />
          ))}
      </div>

      {confirm && (
        <ConfirmDialog
          open={true}
          title={confirm.title}
          description={confirm.body}
          confirmLabel={confirm.label}
          onConfirm={applyConfirm}
          onCancel={() => setConfirm(null)}
          loading={acting}
        />
      )}
    </div>
  );
}
