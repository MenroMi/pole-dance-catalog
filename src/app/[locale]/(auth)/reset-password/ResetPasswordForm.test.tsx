import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/auth/actions', () => ({
  resetPasswordAction: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { resetPasswordAction } from '@/features/auth/actions';
import ResetPasswordForm from './ResetPasswordForm';

const mockAction = resetPasswordAction as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('ResetPasswordForm', () => {
  it('renders new password and confirm password fields', () => {
    render(<ResetPasswordForm token="valid-token" />);
    expect(screen.getByLabelText('passwordLabel')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument();
  });

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await user.type(screen.getByLabelText('passwordLabel'), 'NewPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('calls resetPasswordAction with token and password on valid submit', async () => {
    mockAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await user.type(screen.getByLabelText('passwordLabel'), 'NewPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(mockAction).toHaveBeenCalledWith('valid-token', 'NewPass1!');
  });

  it('shows invalidToken message when action returns { error: "expired" }', async () => {
    mockAction.mockResolvedValue({ error: 'expired' });
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await user.type(screen.getByLabelText('passwordLabel'), 'NewPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('invalidToken', { exact: false })).toBeInTheDocument();
  });

  it('shows invalidToken message when action returns { error: "invalid" }', async () => {
    mockAction.mockResolvedValue({ error: 'invalid' });
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await user.type(screen.getByLabelText('passwordLabel'), 'NewPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('invalidToken', { exact: false })).toBeInTheDocument();
  });
});
