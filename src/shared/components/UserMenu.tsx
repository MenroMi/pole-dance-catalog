'use client';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { signOut } from 'next-auth/react';
import React, { useState } from 'react';

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
};

const NAV_ITEMS = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/profile/settings' },
];

export default function UserMenu({ user }: UserMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<boolean>(false);

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
            aria-label="Account menu"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
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
              Log out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/login">Log in</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You&rsquo;ll need to sign back in to access your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
          {signOutError && (
            <p className="mt-2 text-center text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
