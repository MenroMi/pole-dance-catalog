import * as resendModule from 'resend';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('resend', () => {
  const mockSend = vi.fn();
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => `[${key}]`),
}));

import { sendPasswordResetEmail } from './reset-email';
import { getTranslations } from 'next-intl/server';

const mockSend = (resendModule as unknown as { __mockSend: Mock }).__mockSend;

beforeEach(() => {
  mockSend.mockClear();
  vi.mocked(getTranslations).mockResolvedValue(((key: string) => `[${key}]`) as never);
});

describe('sendPasswordResetEmail', () => {
  it('calls Resend with correct to and token URL', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await sendPasswordResetEmail('user@example.com', 'test-token-123', 'pl');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        html: expect.stringContaining('/pl/reset-password'),
      }),
    );
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('test-token-123');
  });

  it('sends Polish subject when locale is pl', async () => {
    vi.mocked(getTranslations).mockResolvedValue(((key: string) =>
      key === 'subject' ? 'Resetowanie hasła — Pole Space' : `[${key}]`) as never);
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });

    await sendPasswordResetEmail('u@e.com', 'tok', 'pl');

    expect(getTranslations).toHaveBeenCalledWith({
      locale: 'pl',
      namespace: 'emails.passwordReset',
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Resetowanie hasła — Pole Space' }),
    );
  });

  it('sends English subject when locale is en', async () => {
    vi.mocked(getTranslations).mockResolvedValue(((key: string) =>
      key === 'subject' ? 'Password reset — Pole Space' : `[${key}]`) as never);
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });

    await sendPasswordResetEmail('u@e.com', 'tok', 'en');

    expect(getTranslations).toHaveBeenCalledWith({
      locale: 'en',
      namespace: 'emails.passwordReset',
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Password reset — Pole Space' }),
    );
  });

  it('throws if Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'API error' } });

    await expect(sendPasswordResetEmail('user@example.com', 'token', 'pl')).rejects.toThrow();
  });
});
