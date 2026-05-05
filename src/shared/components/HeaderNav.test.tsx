import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from '@/i18n/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HeaderNav from './HeaderNav';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: React.ReactNode;
  }) => React.createElement('a', { href, ...props }, children),
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('HeaderNav', () => {
  it('renders Catalog link with correct href', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'catalog' })).toHaveAttribute('href', '/catalog');
  });

  it('applies active class to Catalog when on /catalog', () => {
    vi.mocked(usePathname).mockReturnValue('/catalog');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'catalog' }).className).toContain('text-primary');
  });

  it('applies active class to Catalog when pathname starts with /catalog/', () => {
    vi.mocked(usePathname).mockReturnValue('/catalog/some-page');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'catalog' }).className).toContain('text-primary');
  });

  it('does not apply active class to Catalog when on a different path', () => {
    vi.mocked(usePathname).mockReturnValue('/profile');
    render(<HeaderNav />);
    expect(screen.getByRole('link', { name: 'catalog' }).className).not.toContain('text-primary');
  });
});
