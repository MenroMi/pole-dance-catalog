import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from './page';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
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
    expect(screen.getByText(/quiet place/i)).toBeInTheDocument();
  });

  it('shows "Create an account" link pointing to /signup', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    const link = screen.getByRole('link', { name: /create an account/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('shows "Browse the catalog" link pointing to /catalog', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    const link = screen.getByRole('link', { name: /browse the catalog/i });
    expect(link).toHaveAttribute('href', '/catalog');
  });

  it('shows "Free. No invite needed." hint', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    render(await HomePage(mockParams));
    expect(screen.getByText(/free\. no invite needed\./i)).toBeInTheDocument();
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
