import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

// Mock Radix primitives so tests don't depend on JSDOM portal/pointer quirks
vi.mock('@/shared/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    disabled,
    onSelect,
    className,
    asChild,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onSelect?: () => void;
    className?: string;
    asChild?: boolean;
  }) => (
    <div role="menuitem" aria-disabled={disabled} className={className} onClick={onSelect}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

const AlertDialogOnOpenChange = React.createContext<((open: boolean) => void) | undefined>(
  undefined,
);

vi.mock('@/shared/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    open ? (
      <AlertDialogOnOpenChange.Provider value={onOpenChange}>
        <div>{children}</div>
      </AlertDialogOnOpenChange.Provider>
    ) : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => {
    const onOpenChange = React.useContext(AlertDialogOnOpenChange);
    return <button onClick={() => onOpenChange?.(false)}>{children}</button>;
  },
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }) => <button onClick={onClick}>{children}</button>,
}));

import { signOut } from 'next-auth/react';
import UserMenu from './UserMenu';

const mockSignOut = signOut as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue(undefined);
});

describe('UserMenu — unauthenticated (user=null)', () => {
  it('renders the account icon trigger', () => {
    render(<UserMenu user={null} />);
    expect(screen.getByRole('button', { name: 'accountMenu' })).toBeInTheDocument();
  });

  it('renders Profile and Settings as disabled', () => {
    render(<UserMenu user={null} />);
    expect(screen.getByRole('menuitem', { name: 'profile' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'settings' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('renders Log in as active (not disabled)', () => {
    render(<UserMenu user={null} />);
    const logIn = screen.getByRole('menuitem', { name: 'logIn' });
    expect(logIn).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('does not render Log out', () => {
    render(<UserMenu user={null} />);
    expect(screen.queryByRole('menuitem', { name: 'logOut' })).not.toBeInTheDocument();
  });
});

describe('UserMenu — authenticated (user provided)', () => {
  const user = { name: 'Alice', image: null };

  it('shows user name in the dropdown header', () => {
    render(<UserMenu user={user} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders Profile and Settings as active (not disabled)', () => {
    render(<UserMenu user={user} />);
    expect(screen.getByRole('menuitem', { name: 'profile' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'settings' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('renders Log out and not Log in', () => {
    render(<UserMenu user={user} />);
    expect(screen.getByRole('menuitem', { name: 'logOut' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'logIn' })).not.toBeInTheDocument();
  });

  it('shows avatar image when user has an image', () => {
    render(<UserMenu user={{ name: 'Alice', image: 'https://example.com/avatar.jpg' }} />);
    expect(screen.getByAltText('Alice')).toBeInTheDocument();
  });

  it('shows initial letter when user has no image', () => {
    render(<UserMenu user={user} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

describe('UserMenu — Log out confirmation', () => {
  const user = { name: 'Alice', image: null };

  it('clicking Log out opens confirmation dialog', async () => {
    const u = userEvent.setup();
    render(<UserMenu user={user} />);
    await u.click(screen.getByRole('menuitem', { name: 'logOut' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('logOutConfirmTitle')).toBeInTheDocument();
  });

  it('clicking Cancel closes the dialog without calling signOut', async () => {
    const u = userEvent.setup();
    render(<UserMenu user={user} />);
    await u.click(screen.getByRole('menuitem', { name: 'logOut' }));
    await u.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('clicking Log out in dialog calls signOut', async () => {
    const u = userEvent.setup();
    render(<UserMenu user={user} />);
    await u.click(screen.getByRole('menuitem', { name: 'logOut' }));
    await u.click(screen.getByRole('button', { name: 'logOutConfirmAction' }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows error message when signOut rejects', async () => {
    mockSignOut.mockRejectedValue(new Error('network'));
    const u = userEvent.setup();
    render(<UserMenu user={user} />);
    await u.click(screen.getByRole('menuitem', { name: 'logOut' }));
    await u.click(screen.getByRole('button', { name: 'logOutConfirmAction' }));
    expect(await screen.findByText('logOutError')).toBeInTheDocument();
  });
});
