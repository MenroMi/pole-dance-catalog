import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from '@/i18n/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from './page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: React.ReactNode;
  }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));
vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));

import { auth } from '@/shared/lib/auth';

const mockParams = { params: Promise.resolve({ locale: 'pl' }) };

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /catalog when session exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } } as never);
    await HomePage(mockParams);
    expect(redirect).toHaveBeenCalledWith('/catalog');
  });

  it('renders landing content when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    expect(screen.getByText('heading')).toBeInTheDocument();
  });

  it('shows "Create an account" link pointing to /signup', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    const link = screen.getByRole('link', { name: 'createAccount' });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('shows "Browse the catalog" link pointing to /catalog', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    const link = screen.getByRole('link', { name: 'browseCatalog' });
    expect(link).toHaveAttribute('href', '/catalog');
  });

  it('shows hint text', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    expect(screen.getByText('hint')).toBeInTheDocument();
  });

  it('brand span has aria-label "pole space"', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    expect(screen.getByLabelText('pole space')).toBeInTheDocument();
  });

  it('decorative dot is aria-hidden', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
