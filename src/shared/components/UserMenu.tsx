'use client';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { Link } from '@/i18n/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

type UserMenuProps = {
  user: { name: string | null; image: string | null } | null;
  role?: string | null;
};

export default function UserMenu({ user, role }: UserMenuProps) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<boolean>(false);

  const NAV_ITEMS = [
    { label: t('profile'), href: '/profile' },
    { label: t('settings'), href: '/profile/settings' },
    ...(role === 'ADMIN' ? [{ label: t('admin'), href: '/admin' }] : []),
  ];

  const handleDialogOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) setSignOutError(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('accountMenu')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors hover:border-primary/20 hover:bg-primary/[0.06]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {user && (
            <>
              <DropdownMenuLabel>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? 'Avatar'}
                    width={42}
                    height={42}
                    className="h-[42px] w-[42px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-surface">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-sm font-medium text-on-surface">{user.name ?? 'User'}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {NAV_ITEMS.map(({ label, href }) =>
            user ? (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>{label}</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={href} disabled>
                {label}
              </DropdownMenuItem>
            ),
          )}

          <DropdownMenuSeparator />

          {user ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              {t('logOut')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/login">{t('logIn')}</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('logOutConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('logOutConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e: React.MouseEvent) => {
                e.preventDefault();
                try {
                  await signOut({ callbackUrl: '/' });
                } catch {
                  setSignOutError(true);
                }
              }}
            >
              {t('logOutConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
          {signOutError && (
            <p className="mt-2 text-center text-sm text-destructive">{t('logOutError')}</p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
