import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

import MoveBreadcrumb from './MoveBreadcrumb';

describe('MoveBreadcrumb', () => {
  it('renders Catalog link to /catalog', async () => {
    render(await MoveBreadcrumb({ category: 'SPINS', moveName: 'Fireman Spin' }));
    expect(screen.getByRole('link', { name: 'breadcrumb' })).toHaveAttribute('href', '/catalog');
  });

  it('renders category label', async () => {
    render(await MoveBreadcrumb({ category: 'SPINS', moveName: 'Fireman Spin' }));
    expect(screen.getByText('SPINS')).toBeInTheDocument();
  });

  it('renders move name', async () => {
    render(await MoveBreadcrumb({ category: 'SPINS', moveName: 'Fireman Spin' }));
    expect(screen.getByText('Fireman Spin')).toBeInTheDocument();
  });
});
