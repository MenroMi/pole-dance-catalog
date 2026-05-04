import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { auth } from '@/shared/lib/auth';

import Header from './Header';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));
vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('./FavouritesButton', () => ({ default: () => <div data-testid="favourites-button" /> }));
vi.mock('./HeaderNav', () => ({ default: () => <nav data-testid="header-nav" /> }));
vi.mock('./LocaleSwitcher', () => ({ default: () => <div data-testid="locale-switcher" /> }));
vi.mock('./UserMenu', () => ({
  default: (props: { user: { name: string | null; image: string | null } | null }) => (
    <div data-testid="user-menu" data-user={JSON.stringify(props.user)} />
  ),
}));

const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('Header', () => {
  it('renders wordmark linking to / when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    render(await Header());
    expect(screen.getByRole('link', { name: /pole space/i })).toHaveAttribute('href', '/');
  });

  it('renders wordmark linking to /catalog when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1', role: 'USER', name: 'Alice', image: null } });
    render(await Header());
    expect(screen.getByRole('link', { name: /pole space/i })).toHaveAttribute('href', '/catalog');
  });

  it('renders HeaderNav', async () => {
    mockAuth.mockResolvedValue(null);
    render(await Header());
    expect(screen.getByTestId('header-nav')).toBeInTheDocument();
  });

  it('passes user=null to UserMenu when no session', async () => {
    mockAuth.mockResolvedValue(null);
    render(await Header());
    const menu = screen.getByTestId('user-menu');
    expect(JSON.parse(menu.getAttribute('data-user')!)).toBeNull();
  });

  it('passes user object to UserMenu when session exists', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'USER', name: 'Alice', image: 'https://example.com/avatar.jpg' },
    });
    render(await Header());
    const menu = screen.getByTestId('user-menu');
    expect(JSON.parse(menu.getAttribute('data-user')!)).toEqual({
      name: 'Alice',
      image: 'https://example.com/avatar.jpg',
    });
  });
});
