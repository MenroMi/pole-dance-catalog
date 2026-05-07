'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';

import {
  blockUserAction,
  changeUserRoleAction,
  deleteUserAction,
  getUsersForAdminAction,
  unblockUserAction,
} from '../actions';
import type { AdminUserRow } from '../types';

import { ConfirmDialog } from './ConfirmDialog';

function UserAvatar({ user }: { user: AdminUserRow }) {
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join('') || user.email[0].toUpperCase();

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={initials}
        width={36}
        height={36}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(220,184,255,0.15)',
        border: '1px solid rgba(220,184,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#dcb8ff',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function AdminUsers() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [togglingBlock, setTogglingBlock] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);

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

  async function handleToggleBlock(user: AdminUserRow) {
    if (!user.blockedAt) {
      setBlockTarget(user.id);
    } else {
      setTogglingBlock(user.id);
      try {
        await unblockUserAction(user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, blockedAt: null } : u)));
      } catch (e) {
        console.error(e);
      } finally {
        setTogglingBlock(null);
      }
    }
  }

  async function handleBlockConfirm() {
    if (!blockTarget) return;
    setBlocking(true);
    try {
      await blockUserAction(blockTarget);
      setUsers((prev) =>
        prev.map((u) => (u.id === blockTarget ? { ...u, blockedAt: new Date() } : u)),
      );
      setBlockTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setBlocking(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUserAction(deleteTarget);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
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
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {error}
          <button
            onClick={refresh}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 13,
              padding: 0,
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
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr 100px 140px 100px',
            gap: 16,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#555',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t('users.cols.user')}</span>
          <span>{t('users.cols.location')}</span>
          <span>{t('users.cols.joined')}</span>
          <span>{t('users.cols.role')}</span>
          <span>{t('users.cols.actions')}</span>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>Loading...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
            {t('users.noUsers')}
          </div>
        )}

        {!loading &&
          filtered.map((user, i) => {
            const isBlocked = Boolean(user.blockedAt);
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

            return (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1fr 100px 140px 100px',
                  gap: 16,
                  padding: '14px 20px',
                  borderBottom:
                    i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  opacity: isBlocked ? 0.6 : 1,
                  background: isBlocked ? 'rgba(248,113,113,0.03)' : 'transparent',
                  transition: 'opacity 150ms',
                }}
              >
                {/* User: avatar + email + name + blocked badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <UserAvatar user={user} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          color: '#e0e0e0',
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </span>
                      {isBlocked && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 20,
                            background: 'rgba(248,113,113,0.15)',
                            color: '#f87171',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                          }}
                        >
                          {t('users.blocked')}
                        </span>
                      )}
                    </div>
                    {fullName && (
                      <div style={{ color: '#555', fontSize: 12, marginTop: 1 }}>{fullName}</div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <span
                  style={{
                    color: '#666',
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.location || t('users.noLocation')}
                </span>

                {/* Joined */}
                <span style={{ color: '#555', fontSize: 12 }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>

                {/* Role badge + dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={changingRole === user.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: `1px solid ${user.role === 'ADMIN' ? 'rgba(220,184,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      background:
                        user.role === 'ADMIN' ? 'rgba(220,184,255,0.1)' : 'rgba(255,255,255,0.04)',
                      color: user.role === 'ADMIN' ? '#dcb8ff' : '#888',
                      cursor: changingRole === user.id ? 'wait' : 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      transition: 'all 150ms',
                    }}
                    asChild={false}
                  >
                    {user.role === 'ADMIN' && <span style={{ fontSize: 10 }}>✦</span>}
                    {changingRole === user.id ? '...' : user.role}
                    <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
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
                        style={{ color: '#dcb8ff', cursor: 'pointer', fontSize: 13 }}
                      >
                        ✦ {t('users.makeAdmin')}
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'USER' && (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, 'USER')}
                        style={{ color: '#e0e0e0', cursor: 'pointer', fontSize: 13 }}
                      >
                        {t('users.makeUser')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Actions: block + delete */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleToggleBlock(user)}
                    disabled={togglingBlock === user.id}
                    title={isBlocked ? t('users.unblock') : t('users.block')}
                    style={{
                      background: isBlocked ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
                      border: 'none',
                      borderRadius: 6,
                      color: isBlocked ? '#4ade80' : '#888',
                      padding: '5px 8px',
                      cursor: togglingBlock === user.id ? 'wait' : 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      transition: 'all 150ms',
                    }}
                  >
                    {isBlocked ? '⊘' : '◉'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user.id)}
                    title={t('users.deleteUser')}
                    style={{
                      background: 'rgba(248,113,113,0.08)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#f87171',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      transition: 'all 150ms',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <ConfirmDialog
        open={blockTarget !== null}
        title={t('users.block')}
        description={t('users.confirmBlock')}
        confirmLabel={t('users.block')}
        onConfirm={handleBlockConfirm}
        onCancel={() => setBlockTarget(null)}
        loading={blocking}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('users.deleteUser')}
        description={t('users.confirmDelete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
