import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth', () => ({
  resendVerificationAction: vi.fn(),
}));

import { resendVerificationAction } from '@/features/auth';

import { ExpiredEmailForm } from './ExpiredEmailForm';

const mockResend = resendVerificationAction as ReturnType<typeof vi.fn>;

describe('ExpiredEmailForm', () => {
  it('renders email input and submit button', () => {
    const { getByPlaceholderText, getByRole } = render(<ExpiredEmailForm />);
    expect(getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(getByRole('button', { name: 'resend verification email' })).toBeInTheDocument();
  });

  it('calls resendVerificationAction with the entered email on submit', async () => {
    mockResend.mockResolvedValue(undefined);
    const { getByPlaceholderText, container } = render(<ExpiredEmailForm />);

    fireEvent.change(getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('disables input and button while pending', async () => {
    let resolve!: () => void;
    mockResend.mockReturnValue(new Promise<void>((r) => (resolve = r)));

    const { getByPlaceholderText, getByRole, container } = render(<ExpiredEmailForm />);

    fireEvent.change(getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });

    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(getByRole('button')).toBeDisabled();
      expect(getByPlaceholderText('your@email.com')).toBeDisabled();
    });

    resolve();
  });
});
