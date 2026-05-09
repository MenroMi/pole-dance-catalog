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
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/shared/lib/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/shared/lib/prisma';
import { cloudinary } from '@/shared/lib/cloudinary';

const mockRevalidatePath = revalidatePath as ReturnType<typeof vi.fn>;

import {
  blockUserAction,
  changeUserRoleAction,
  createMoveAction,
  createTagAction,
  deleteTagAction,
  deleteMoveAction,
  deleteUserAction,
  getAdminStatsAction,
  getMoveByIdAction,
  getMovesForAdminAction,
  getMovesListAction,
  getTagsForAdminAction,
  getUsersForAdminAction,
  unblockUserAction,
  updateMoveAction,
  updateTagAction,
  uploadMoveImageAction,
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
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockUserDelete = prisma.user.delete as ReturnType<typeof vi.fn>;
const mockUserCount = prisma.user.count as ReturnType<typeof vi.fn>;
const mockUploadStream = cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>;

const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } };
const userSession = { user: { id: 'user-1', role: 'USER' } };

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
  relatedMoveIds: [],
};

const validUpdateInput = { ...validCreateInput, id: 'move-1' };

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindUnique.mockResolvedValue({ blockedAt: null });
});

describe('requireAdmin blockedAt check', () => {
  it('throws Unauthorized when admin is blocked', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ blockedAt: new Date() });
    await expect(createMoveAction(validCreateInput)).rejects.toThrow('Unauthorized');
    expect(mockMoveCreate).not.toHaveBeenCalled();
  });
});

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

  it('returns { moves, total } when ADMIN', async () => {
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
    mockMoveCount.mockResolvedValueOnce(1).mockResolvedValueOnce(10);
    const result = await getMovesForAdminAction();
    expect(result).toEqual({ moves: rows, total: 1, totalAll: 10 });
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('throws Invalid input when page is less than 1', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getMovesForAdminAction({ page: 0 })).rejects.toThrow('Invalid input');
    expect(mockMoveFindMany).not.toHaveBeenCalled();
  });

  it('throws Invalid input when pageSize exceeds 100', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getMovesForAdminAction({ pageSize: 101 })).rejects.toThrow('Invalid input');
    expect(mockMoveFindMany).not.toHaveBeenCalled();
  });

  it('throws Invalid input when query exceeds 200 characters', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getMovesForAdminAction({ query: 'a'.repeat(201) })).rejects.toThrow(
      'Invalid input',
    );
    expect(mockMoveFindMany).not.toHaveBeenCalled();
  });

  it('passes query as case-insensitive OR across title_en/title_pl', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    mockMoveCount.mockResolvedValue(0);
    await getMovesForAdminAction({ query: 'spin' });
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { title_en: { contains: 'spin', mode: 'insensitive' } },
                { title_pl: { contains: 'spin', mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    );
  });

  it('filters by difficulty when not ALL', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    mockMoveCount.mockResolvedValue(0);
    await getMovesForAdminAction({ difficulty: 'BEGINNER' });
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ difficulty: 'BEGINNER' }] },
      }),
    );
  });

  it('applies page and pageSize as take/skip', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    mockMoveCount.mockResolvedValue(0);
    await getMovesForAdminAction({ page: 2, pageSize: 10 });
    expect(mockMoveFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 10 }));
  });

  it('combines query and difficulty with AND', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    mockMoveCount.mockResolvedValue(0);
    await getMovesForAdminAction({ query: 'spin', difficulty: 'ADVANCED' });
    const call = mockMoveFindMany.mock.calls[0][0];
    expect(call.where.AND).toHaveLength(2);
    expect(call.where.AND[1]).toEqual({ difficulty: 'ADVANCED' });
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
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('getUsersForAdminAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getUsersForAdminAction()).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when page is less than 1', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getUsersForAdminAction({ page: 0 })).rejects.toThrow('Invalid input');
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('throws Invalid input when pageSize exceeds 100', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getUsersForAdminAction({ pageSize: 101 })).rejects.toThrow('Invalid input');
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('throws Invalid input when query exceeds 200 characters', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(getUsersForAdminAction({ query: 'a'.repeat(201) })).rejects.toThrow(
      'Invalid input',
    );
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns { users, total, totalAll, totalAdmins, totalBlocked } when ADMIN', async () => {
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
    // counts: total(filtered)=1, totalAll=5, totalAdmins=2, totalBlocked=0
    mockUserCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    const result = await getUsersForAdminAction();
    expect(result.users).toEqual(users);
    expect(result).toMatchObject({ total: 1, totalAll: 5, totalAdmins: 2, totalBlocked: 0 });
  });

  it('passes query as case-insensitive OR across email/firstName/lastName', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    await getUsersForAdminAction({ query: 'alice' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { email: { contains: 'alice', mode: 'insensitive' } },
                { firstName: { contains: 'alice', mode: 'insensitive' } },
                { lastName: { contains: 'alice', mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
    );
  });

  it('filters by BLOCKED roleFilter', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    await getUsersForAdminAction({ roleFilter: 'BLOCKED' });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ blockedAt: { not: null } }] },
      }),
    );
  });

  it('applies page and pageSize as take/skip', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    await getUsersForAdminAction({ page: 3, pageSize: 10 });
    expect(mockUserFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 20 }));
  });

  it('combines query and roleFilter with AND', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    await getUsersForAdminAction({ query: 'bob', roleFilter: 'ADMIN' });
    const call = mockUserFindMany.mock.calls[0][0];
    expect(call.where.AND).toHaveLength(2);
    expect(call.where.AND[1]).toEqual({ role: 'ADMIN' });
  });
});

describe('changeUserRoleAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(changeUserRoleAction('u-1', 'ADMIN')).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when userId is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(changeUserRoleAction('', 'ADMIN')).rejects.toThrow('Invalid input');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws Invalid input when role is not USER or ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(changeUserRoleAction('u-1', 'SUPERADMIN' as 'ADMIN')).rejects.toThrow(
      'Invalid input',
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws when admin tries to change their own role', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(changeUserRoleAction('admin-1', 'USER')).rejects.toThrow(
      'Cannot change your own role',
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('updates user role when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserUpdate.mockResolvedValue({ id: 'u-1', role: 'ADMIN' });
    await changeUserRoleAction('u-1', 'ADMIN');
    expect(mockUserUpdate).toHaveBeenCalledWith({ where: { id: 'u-1' }, data: { role: 'ADMIN' } });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('blockUserAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(blockUserAction('u-1')).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when userId is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(blockUserAction('')).rejects.toThrow('Invalid input');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws when admin tries to block themselves', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(blockUserAction('admin-1')).rejects.toThrow('Cannot block yourself');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('sets blockedAt when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserUpdate.mockResolvedValue({ id: 'u-1' });
    await blockUserAction('u-1');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data: expect.objectContaining({ blockedAt: expect.any(Date) }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('throws Invalid input when reason exceeds 500 characters', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(blockUserAction('u-1', 'x'.repeat(501))).rejects.toThrow('Invalid input');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('persists blockReason when provided', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserUpdate.mockResolvedValue({ id: 'u-1' });
    await blockUserAction('u-1', 'spam');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ blockReason: 'spam' }),
      }),
    );
  });
});

describe('unblockUserAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(unblockUserAction('u-1')).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when userId is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(unblockUserAction('')).rejects.toThrow('Invalid input');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('throws when admin tries to unblock themselves', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(unblockUserAction('admin-1')).rejects.toThrow('Cannot unblock yourself');
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('clears blockedAt and blockReason when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserUpdate.mockResolvedValue({ id: 'u-1' });
    await unblockUserAction('u-1');
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { blockedAt: null, blockReason: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('deleteUserAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteUserAction('u-1')).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when userId is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(deleteUserAction('')).rejects.toThrow('Invalid input');
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('throws when admin tries to delete themselves', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(deleteUserAction('admin-1')).rejects.toThrow('Cannot delete yourself');
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('deletes user when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockUserDelete.mockResolvedValue({ id: 'u-1' });
    await deleteUserAction('u-1');
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('getMovesListAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getMovesListAction()).rejects.toThrow('Unauthorized');
    expect(mockMoveFindMany).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when role is not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(getMovesListAction()).rejects.toThrow('Unauthorized');
  });

  it('returns moves list with take:200', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const moves = [
      { id: 'm-1', title_en: 'A', title_pl: 'A PL' },
      { id: 'm-2', title_en: 'B', title_pl: 'B PL' },
    ];
    mockMoveFindMany.mockResolvedValue(moves);
    const result = await getMovesListAction();
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 200,
        select: { id: true, title_en: true, title_pl: true },
      }),
    );
    expect(result).toEqual(moves);
  });
});

describe('uploadMoveImageAction', () => {
  function makeFormData(file: File | null): FormData {
    const fd = new FormData();
    if (file) fd.append('image', file);
    return fd;
  }

  function makeFile(content: number[], name = 'test.jpg', type = 'image/jpeg'): File {
    return new File([new Uint8Array(content)], name, { type });
  }

  const jpegMagic = [0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)];

  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(uploadMoveImageAction(makeFormData(null))).rejects.toThrow('Unauthorized');
    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  it('throws when no file provided', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(uploadMoveImageAction(makeFormData(null))).rejects.toThrow('No file provided');
  });

  it('throws when MIME type is not image', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const file = makeFile(jpegMagic, 'doc.pdf', 'application/pdf');
    await expect(uploadMoveImageAction(makeFormData(file))).rejects.toThrow(
      'Only image files are allowed',
    );
  });

  it('throws when file exceeds 5MB', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const bigContent = Array(5 * 1024 * 1024 + 1).fill(0xff);
    const file = makeFile(bigContent, 'big.jpg', 'image/jpeg');
    await expect(uploadMoveImageAction(makeFormData(file))).rejects.toThrow(
      'File size must be under 5MB',
    );
  });

  it('throws when magic bytes do not match image format', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const file = makeFile([0x00, 0x01, 0x02, 0x03], 'fake.jpg', 'image/jpeg');
    await expect(uploadMoveImageAction(makeFormData(file))).rejects.toThrow(
      'Only image files are allowed',
    );
  });

  it('returns imageUrl on successful upload', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const file = makeFile(jpegMagic, 'photo.jpg', 'image/jpeg');
    mockUploadStream.mockImplementation(
      (_opts: unknown, cb: (err: null, res: { secure_url: string }) => void) => {
        cb(null, { secure_url: 'https://res.cloudinary.com/test/photo.jpg' });
        return { end: vi.fn() };
      },
    );
    const result = await uploadMoveImageAction(makeFormData(file));
    expect(result).toEqual({ imageUrl: 'https://res.cloudinary.com/test/photo.jpg' });
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'pole-dance-catalog/moves' }),
      expect.any(Function),
    );
  });
});
