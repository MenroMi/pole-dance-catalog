'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import { changeUserRoleAction, getUsersForAdminAction } from '../actions';
import type { AdminUserRow } from '../types';

export function AdminUsers() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsersForAdminAction()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div>
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
          <span>Email</span>
          <span>Name</span>
          <span>Joined</span>
          <span>Role</span>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>
        )}

        {!loading && users.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No users found</div>
        )}

        {!loading &&
          users.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 120px',
                gap: 16,
                padding: '14px 20px',
                borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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
