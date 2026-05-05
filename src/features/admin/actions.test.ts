import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    move: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import { createMoveAction, deleteMoveAction } from './actions';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockCreate = prisma.move.create as ReturnType<typeof vi.fn>;
const mockDelete = prisma.move.delete as ReturnType<typeof vi.fn>;

const adminSession = { user: { role: 'ADMIN' } };
const userSession = { user: { role: 'USER' } };

const validInput = {
  title_pl: 'Test Move PL',
  title_en: 'Test Move EN',
  description_pl: 'desc pl',
  description_en: 'desc en',
  difficulty: 'BEGINNER' as const,
  category: 'SPINS' as const,
  youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
  imageUrl: undefined,
  tags: [],
};

beforeEach(() => vi.clearAllMocks());

describe('createMoveAction', () => {
  it('throws Invalid input when youtubeUrl is not a valid URL', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(createMoveAction({ ...validInput, youtubeUrl: 'not-a-url' })).rejects.toThrow(
      'Invalid input',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws Invalid input when imageUrl is not a valid URL', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(createMoveAction({ ...validInput, imageUrl: 'not-a-url' })).rejects.toThrow(
      'Invalid input',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createMoveAction(validInput)).rejects.toThrow('Unauthorized');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when role is not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(createMoveAction(validInput)).rejects.toThrow('Unauthorized');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates move when role is ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockCreate.mockResolvedValue({ id: 'move-1' });
    const result = await createMoveAction(validInput);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title_pl: validInput.title_pl,
          title_en: validInput.title_en,
          difficulty: validInput.difficulty,
        }),
      }),
    );
    expect(result).toEqual({ id: 'move-1' });
  });
});

describe('deleteMoveAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteMoveAction('move-1')).rejects.toThrow('Unauthorized');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when role is not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(deleteMoveAction('move-1')).rejects.toThrow('Unauthorized');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes move when role is ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDelete.mockResolvedValue({ id: 'move-1' });
    const result = await deleteMoveAction('move-1');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'move-1' } });
    expect(result).toEqual({ id: 'move-1' });
  });
});
