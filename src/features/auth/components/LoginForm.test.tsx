import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LoginForm } from './LoginForm';

vi.mock('@/features/auth/actions', () => ({
  loginAction: vi.fn(),
  signInWithOAuthAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
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

import { loginAction, signInWithOAuthAction } from '@/features/auth/actions';
import { useSearchParams } from 'next/navigation';
const mockLoginAction = loginAction as ReturnType<typeof vi.fn>;
const mockSignInWithOAuthAction = signInWithOAuthAction as ReturnType<typeof vi.fn>;
const mockUseSearchParams = useSearchParams as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginForm', () => {
  it('renders email and password fields and a submit button', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument();
  });

  it('renders forgot password link pointing to /forgot-password', () => {
    render(<LoginForm />);
    const link = screen.getByRole('link', { name: /forgot/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('calls loginAction with form data on valid submit', async () => {
    mockLoginAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(mockLoginAction).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
  });

  it('shows reset success banner when ?reset=true is in URL', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('reset=true'));
    render(<LoginForm />);
    expect(screen.getByText('resetBanner')).toBeInTheDocument();
  });

  it('shows verified banner when ?verified=true is in URL', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('verified=true'));
    render(<LoginForm />);
    expect(screen.getByText('verifiedBanner')).toBeInTheDocument();
  });

  it('displays server error returned from loginAction', async () => {
    mockLoginAction.mockResolvedValue({ error: 'Invalid credentials' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('invalidCredentials')).toBeInTheDocument();
  });
});

describe('OAuth buttons', () => {
  it('calls signInWithOAuthAction with google when Google button clicked', async () => {
    mockSignInWithOAuthAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /continueWithGoogle/i }));
    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith('google', undefined);
  });

  it('passes callbackUrl from search params to signInWithOAuthAction', async () => {
    mockSignInWithOAuthAction.mockResolvedValue(undefined);
    mockUseSearchParams.mockReturnValue(new URLSearchParams('callbackUrl=/pl/profile'));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /continueWithGoogle/i }));
    expect(mockSignInWithOAuthAction).toHaveBeenCalledWith('google', '/pl/profile');
  });
});

describe('OAuth error banner', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('shows account-not-linked message for OAuthAccountNotLinked error', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=OAuthAccountNotLinked'));
    render(<LoginForm />);
    expect(screen.getByText('oauthAccountNotLinked')).toBeInTheDocument();
  });

  it('shows generic message for unknown OAuth error code', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=SomeUnknownError'));
    render(<LoginForm />);
    expect(screen.getByText('oauthGeneric')).toBeInTheDocument();
  });

  it('shows no OAuth error banner when error param is absent', () => {
    render(<LoginForm />);
    expect(screen.queryByText('oauthGeneric')).not.toBeInTheDocument();
  });
});
