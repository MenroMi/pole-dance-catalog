import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/auth/actions', () => ({
  forgotPasswordAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { forgotPasswordAction } from '@/features/auth/actions';
import ForgotPasswordForm from './ForgotPasswordForm';

const mockAction = forgotPasswordAction as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('ForgotPasswordForm', () => {
  it('renders the email form by default', () => {
    render(<ForgotPasswordForm sent={false} expired={false} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows confirmation panel when sent=true', () => {
    render(<ForgotPasswordForm sent={true} expired={false} />);
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
  });

  it('shows expired notice above form when expired=true', () => {
    render(<ForgotPasswordForm sent={false} expired={true} />);
    expect(screen.getByText(/link has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('calls forgotPasswordAction with email on submit', async () => {
    mockAction.mockResolvedValue({ sent: true });
    const user = userEvent.setup();
    render(<ForgotPasswordForm sent={false} expired={false} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(mockAction).toHaveBeenCalledWith('user@example.com');
  });
});
