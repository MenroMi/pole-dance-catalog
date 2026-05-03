import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/shared/lib/prisma';
import {
  generateResetToken,
  findResetToken,
  deleteResetToken,
  deleteResetTokensByEmail,
} from './reset-tokens';

const mockCreate = prisma.passwordResetToken.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.passwordResetToken.findUnique as ReturnType<typeof vi.fn>;
const mockDelete = prisma.passwordResetToken.delete as ReturnType<typeof vi.fn>;
const mockDeleteMany = prisma.passwordResetToken.deleteMany as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('generateResetToken', () => {
  it('returns a UUID string', async () => {
    mockCreate.mockResolvedValue({});
    const token = await generateResetToken('user@example.com', 'pl');
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('creates record with correct email, 1h TTL, and locale', async () => {
    mockCreate.mockResolvedValue({});
    const before = Date.now();
    await generateResetToken('user@example.com', 'pl');
    const after = Date.now();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com',
          token: expect.any(String),
          expiresAt: expect.any(Date),
          locale: 'pl',
        }),
      }),
    );
    const expiresAt: Date = mockCreate.mock.calls[0][0].data.expiresAt;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 100);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 100);
  });

  it('stores the correct locale when called with en', async () => {
    mockCreate.mockResolvedValue({});
    await generateResetToken('user@example.com', 'en');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: 'en' }),
      }),
    );
  });
});

describe('findResetToken', () => {
  it('returns token record when found', async () => {
    const record = {
      id: '1',
      email: 'user@example.com',
      token: 'abc',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      locale: 'pl',
    };
    mockFindUnique.mockResolvedValue(record);
    const result = await findResetToken('abc');
    expect(result).toEqual(record);
  });

  it('returns null when token not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await findResetToken('missing');
    expect(result).toBeNull();
  });
});

describe('deleteResetToken', () => {
  it('deletes by token string', async () => {
    mockDelete.mockResolvedValue({});
    await deleteResetToken('abc');
    expect(mockDelete).toHaveBeenCalledWith({ where: { token: 'abc' } });
  });
});

describe('deleteResetTokensByEmail', () => {
  it('deletes all tokens for an email', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    await deleteResetTokensByEmail('user@example.com');
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
  });
});
