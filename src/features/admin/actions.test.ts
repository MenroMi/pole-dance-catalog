import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    move: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import {
  changeUserRoleAction,
  createMoveAction,
  createTagAction,
  deleteTagAction,
  deleteMoveAction,
  getAdminStatsAction,
  getMoveByIdAction,
  getMovesForAdminAction,
  getTagsForAdminAction,
  getUsersForAdminAction,
  updateMoveAction,
  updateTagAction,
} from './actions';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockMoveCreate = prisma.move.create as ReturnType<typeof vi.fn>;
const mockMoveUpdate = prisma.move.update as ReturnType<typeof vi.fn>;
const mockMoveDelete = prisma.move.delete as ReturnType<typeof vi.fn>;
const mockMoveFindMany = prisma.move.findMany as ReturnType<typeof vi.fn>;
const mockMoveFindUnique = prisma.move.findUnique as ReturnType<typeof vi.fn>;
const mockMoveCount = prisma.move.count as ReturnType<typeof vi.fn>;
const mockTagFindMany = prisma.tag.findMany as ReturnType<typeof vi.fn>;
const mockTagCreate = prisma.tag.create as ReturnType<typeof vi.fn>;
const mockTagUpdate = prisma.tag.update as ReturnType<typeof vi.fn>;
const mockTagDelete = prisma.tag.delete as ReturnType<typeof vi.fn>;
const mockTagCount = prisma.tag.count as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockUserCount = prisma.user.count as ReturnType<typeof vi.fn>;

const adminSession = { user: { role: 'ADMIN' } };
const userSession = { user: { role: 'USER' } };

const validCreateInput = {
  title_pl: 'Test PL',
  title_en: 'Test EN',
  difficulty: 'BEGINNER' as const,
  category: 'SPINS' as const,
  poleTypes: [] as import('@prisma/client').PoleType[],
  youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
  stepsData_pl: [],
  stepsData_en: [],
  tagIds: [],
};

const validUpdateInput = { ...validCreateInput, id: 'move-1' };

beforeEach(() => vi.clearAllMocks());

describe('createMoveAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createMoveAction(validCreateInput)).rejects.toThrow('Unauthorized');
    expect(mockMoveCreate).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when role is not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(createMoveAction(validCreateInput)).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when youtubeUrl is not a URL', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(
      createMoveAction({ ...validCreateInput, youtubeUrl: 'not-a-url' }),
    ).rejects.toThrow('Invalid input');
    expect(mockMoveCreate).not.toHaveBeenCalled();
  });

  it('creates move when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveCreate.mockResolvedValue({ id: 'move-1' });
    const result = await createMoveAction(validCreateInput);
    expect(mockMoveCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title_en: 'Test EN', difficulty: 'BEGINNER' }),
      }),
    );
    expect(result).toEqual({ id: 'move-1' });
  });
});

describe('updateMoveAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateMoveAction(validUpdateInput)).rejects.toThrow('Unauthorized');
    expect(mockMoveUpdate).not.toHaveBeenCalled();
  });

  it('throws Invalid input when youtubeUrl is not a URL', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(updateMoveAction({ ...validUpdateInput, youtubeUrl: 'bad' })).rejects.toThrow(
      'Invalid input',
    );
  });

  it('updates move with tag ids when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveUpdate.mockResolvedValue({ id: 'move-1' });
    const result = await updateMoveAction({ ...validUpdateInput, tagIds: ['tag-1'] });
    expect(mockMoveUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'move-1' },
        data: expect.objectContaining({
          title_en: 'Test EN',
          tags: { set: [], connect: [{ id: 'tag-1' }] },
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
  });

  it('deletes move when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveDelete.mockResolvedValue({ id: 'move-1' });
    await deleteMoveAction('move-1');
    expect(mockMoveDelete).toHaveBeenCalledWith({ where: { id: 'move-1' } });
  });
});

describe('getMovesForAdminAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getMovesForAdminAction()).rejects.toThrow('Unauthorized');
  });

  it('returns move rows when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const rows = [
      {
        id: 'move-1',
        title_en: 'T',
        title_pl: 'T',
        difficulty: 'BEGINNER',
        category: 'SPINS',
        createdAt: new Date(),
        tags: [],
      },
    ];
    mockMoveFindMany.mockResolvedValue(rows);
    const result = await getMovesForAdminAction();
    expect(result).toEqual(rows);
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

describe('getMoveByIdAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getMoveByIdAction('move-1')).rejects.toThrow('Unauthorized');
  });

  it('returns null when move not found', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindUnique.mockResolvedValue(null);
    const result = await getMoveByIdAction('move-1');
    expect(result).toBeNull();
  });

  it('returns full move with tags when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const move = {
      id: 'move-1',
      title_en: 'T',
      tags: [{ id: 'tag-1', name_en: 'Spin', name_pl: 'Spin' }],
    };
    mockMoveFindUnique.mockResolvedValue(move);
    const result = await getMoveByIdAction('move-1');
    expect(result).toEqual(move);
    expect(mockMoveFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'move-1' } }),
    );
  });
});

describe('getAdminStatsAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getAdminStatsAction()).rejects.toThrow('Unauthorized');
  });

  it('returns stats when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveCount.mockResolvedValue(10);
    mockUserCount.mockResolvedValue(5);
    mockTagCount.mockResolvedValue(3);
    mockMoveFindMany.mockResolvedValue([]);
    const result = await getAdminStatsAction();
    expect(result).toEqual({ totalMoves: 10, totalUsers: 5, totalTags: 3, recentMoves: [] });
  });
});

describe('getTagsForAdminAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getTagsForAdminAction()).rejects.toThrow('Unauthorized');
  });

  it('returns tags when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const tags = [
      { id: 'tag-1', name_en: 'Spin', name_pl: 'Spin', color: null, _count: { moves: 2 } },
    ];
    mockTagFindMany.mockResolvedValue(tags);
    const result = await getTagsForAdminAction();
    expect(result).toEqual(tags);
  });
});

describe('createTagAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createTagAction({ name_en: 'T', name_pl: 'T' })).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when name_en is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(createTagAction({ name_en: '', name_pl: 'T' })).rejects.toThrow('Invalid input');
  });

  it('creates tag when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockTagCreate.mockResolvedValue({ id: 'tag-1' });
    await createTagAction({ name_en: 'Spin', name_pl: 'Spin', color: '#ff0000' });
    expect(mockTagCreate).toHaveBeenCalledWith({
      data: { name_en: 'Spin', name_pl: 'Spin', color: '#ff0000' },
    });
  });
});

describe('updateTagAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateTagAction({ id: 'tag-1', name_en: 'T', name_pl: 'T' })).rejects.toThrow(
      'Unauthorized',
    );
  });

  it('updates tag when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockTagUpdate.mockResolvedValue({ id: 'tag-1' });
    await updateTagAction({ id: 'tag-1', name_en: 'Spin', name_pl: 'Spin' });
    expect(mockTagUpdate).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
      data: { name_en: 'Spin', name_pl: 'Spin', color: undefined },
    });
  });
});

describe('deleteTagAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteTagAction('tag-1')).rejects.toThrow('Unauthorized');
  });

  it('deletes tag when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockTagDelete.mockResolvedValue({ id: 'tag-1' });
    await deleteTagAction('tag-1');
    expect(mockTagDelete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
  });
});

describe('getUsersForAdminAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getUsersForAdminAction()).rejects.toThrow('Unauthorized');
  });

  it('returns users when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const users = [
      {
        id: 'u-1',
        email: 'a@b.com',
        firstName: null,
        lastName: null,
        role: 'USER',
        createdAt: new Date(),
      },
    ];
    mockUserFindMany.mockResolvedValue(users);
    const result = await getUsersForAdminAction();
    expect(result).toEqual(users);
  });
});

describe('changeUserRoleAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(changeUserRoleAction('u-1', 'ADMIN')).rejects.toThrow('Unauthorized');
  });

  it('updates user role when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserUpdate.mockResolvedValue({ id: 'u-1', role: 'ADMIN' });
    await changeUserRoleAction('u-1', 'ADMIN');
    expect(mockUserUpdate).toHaveBeenCalledWith({ where: { id: 'u-1' }, data: { role: 'ADMIN' } });
  });
});
