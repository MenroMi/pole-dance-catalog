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

import { sendVerificationEmail } from './email';
import { getTranslations } from 'next-intl/server';

const mockSend = (resendModule as unknown as { __mockSend: Mock }).__mockSend;

beforeEach(() => {
  mockSend.mockClear();
  vi.mocked(getTranslations).mockResolvedValue(((key: string) => `[${key}]`) as never);
});

describe('sendVerificationEmail', () => {
  it('calls Resend with correct to and token URL', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    await sendVerificationEmail('user@example.com', 'abc-token-123', 'pl');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        html: expect.stringContaining('abc-token-123'),
      }),
    );
  });

  it('sends Polish subject when locale is pl', async () => {
    vi.mocked(getTranslations).mockResolvedValue(
      ((key: string) => (key === 'subject' ? 'Zweryfikuj swój e-mail — Pole Space' : `[${key}]`)) as never,
    );
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });

    await sendVerificationEmail('u@e.com', 'tok', 'pl');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Zweryfikuj swój e-mail — Pole Space' }),
    );
  });

  it('sends English subject when locale is en', async () => {
    vi.mocked(getTranslations).mockResolvedValue(
      ((key: string) => (key === 'subject' ? 'Verify your email — Pole Space' : `[${key}]`)) as never,
    );
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });

    await sendVerificationEmail('u@e.com', 'tok', 'en');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Verify your email — Pole Space' }),
    );
  });

  it('throws if Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'API error' } });

    await expect(sendVerificationEmail('user@example.com', 'abc-token-123', 'pl')).rejects.toThrow();
  });
});
