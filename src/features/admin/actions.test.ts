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
      groupBy: vi.fn(),
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
    userFavourite: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
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
      destroy: vi.fn(),
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
  deleteUploadedImageAction,
  deleteUserAction,
  getAdminStatsAction,
  getMoveByIdAction,
  getMovesForAdminAction,
  searchRelatedMovesAction,
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
const mockMoveGroupBy = prisma.move.groupBy as ReturnType<typeof vi.fn>;
const mockUserFavouriteCount = prisma.userFavourite.count as ReturnType<typeof vi.fn>;
const mockUserFavouriteGroupBy = prisma.userFavourite.groupBy as ReturnType<typeof vi.fn>;
const mockUserFavouriteFindMany = prisma.userFavourite.findMany as ReturnType<typeof vi.fn>;
const mockUserProgressCount = prisma.userProgress.count as ReturnType<typeof vi.fn>;
const mockQueryRaw = prisma.$queryRaw as ReturnType<typeof vi.fn>;
const mockUploadStream = cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>;
const mockDestroy = cloudinary.uploader.destroy as ReturnType<typeof vi.fn>;

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
  tagIds: ['tag-1'],
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

  it('throws Invalid input when tagIds is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(createMoveAction({ ...validCreateInput, tagIds: [] })).rejects.toThrow(
      'Invalid input',
    );
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
    mockMoveFindUnique.mockResolvedValue({ imageUrl: null });
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

  it('destroys old Cloudinary image when imageUrl is cleared', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const oldUrl =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/old.jpg';
    mockMoveFindUnique.mockResolvedValue({ imageUrl: oldUrl });
    mockMoveUpdate.mockResolvedValue({ id: 'move-1' });
    mockDestroy.mockResolvedValue({ result: 'ok' });
    await updateMoveAction({ ...validUpdateInput, imageUrl: '' });
    expect(mockDestroy).toHaveBeenCalledWith('pole-dance-catalog/moves/old');
  });

  it('destroys old Cloudinary image when imageUrl is replaced', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const oldUrl =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/old.jpg';
    const newUrl =
      'https://res.cloudinary.com/test/image/upload/v5678/pole-dance-catalog/moves/new.jpg';
    mockMoveFindUnique.mockResolvedValue({ imageUrl: oldUrl });
    mockMoveUpdate.mockResolvedValue({ id: 'move-1' });
    mockDestroy.mockResolvedValue({ result: 'ok' });
    await updateMoveAction({ ...validUpdateInput, imageUrl: newUrl });
    expect(mockDestroy).toHaveBeenCalledWith('pole-dance-catalog/moves/old');
  });

  it('does not call destroy when imageUrl is unchanged', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/same.jpg';
    mockMoveFindUnique.mockResolvedValue({ imageUrl: url });
    mockMoveUpdate.mockResolvedValue({ id: 'move-1' });
    await updateMoveAction({ ...validUpdateInput, imageUrl: url });
    expect(mockDestroy).not.toHaveBeenCalled();
  });
});

describe('deleteMoveAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(deleteMoveAction('move-1')).rejects.toThrow('Unauthorized');
  });

  it('deletes move when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindUnique.mockResolvedValue({ imageUrl: null });
    mockMoveDelete.mockResolvedValue({ id: 'move-1' });
    await deleteMoveAction('move-1');
    expect(mockMoveDelete).toHaveBeenCalledWith({ where: { id: 'move-1' } });
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('destroys Cloudinary image when move has imageUrl', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/photo.jpg';
    mockMoveFindUnique.mockResolvedValue({ imageUrl: url });
    mockMoveDelete.mockResolvedValue({ id: 'move-1' });
    mockDestroy.mockResolvedValue({ result: 'ok' });
    await deleteMoveAction('move-1');
    expect(mockMoveDelete).toHaveBeenCalledWith({ where: { id: 'move-1' } });
    expect(mockDestroy).toHaveBeenCalledWith('pole-dance-catalog/moves/photo');
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
      stepsData_en: null,
      stepsData_pl: null,
      tags: [{ id: 'tag-1', name_en: 'Spin', name_pl: 'Spin' }],
      relatedMoves: [
        {
          id: 'r-1',
          title_en: 'Spin',
          title_pl: 'Spin PL',
          difficulty: 'BEGINNER',
          category: 'SPINS',
          _count: { favourites: 5 },
        },
      ],
    };
    mockMoveFindUnique.mockResolvedValue(move);
    const result = await getMoveByIdAction('move-1');
    expect(result).toEqual({
      ...move,
      stepsData_en: [],
      stepsData_pl: [],
      relatedMoves: [
        {
          id: 'r-1',
          title_en: 'Spin',
          title_pl: 'Spin PL',
          difficulty: 'BEGINNER',
          category: 'SPINS',
          favourites: 5,
        },
      ],
    });
    expect(mockMoveFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'move-1' } }),
    );
  });
});

describe('deleteUploadedImageAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/img.jpg';
    await expect(deleteUploadedImageAction(url)).rejects.toThrow('Unauthorized');
  });

  it('throws Unauthorized when not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/img.jpg';
    await expect(deleteUploadedImageAction(url)).rejects.toThrow('Unauthorized');
  });

  it('calls Cloudinary destroy with the correct public ID when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDestroy.mockResolvedValue({ result: 'ok' });
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/img.jpg';
    await deleteUploadedImageAction(url);
    expect(mockDestroy).toHaveBeenCalledWith('pole-dance-catalog/moves/img');
  });

  it('throws Invalid image URL when URL is outside the moves folder', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/avatars/photo.jpg';
    await expect(deleteUploadedImageAction(url)).rejects.toThrow('Invalid image URL');
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('throws Invalid image URL on path traversal attempt', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/../avatars/photo.jpg';
    await expect(deleteUploadedImageAction(url)).rejects.toThrow('Invalid image URL');
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('resolves without throwing when Cloudinary destroy fails', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockDestroy.mockRejectedValue(new Error('network error'));
    const url =
      'https://res.cloudinary.com/test/image/upload/v1234/pole-dance-catalog/moves/img.jpg';
    await expect(deleteUploadedImageAction(url)).resolves.toBeUndefined();
  });
});

describe('getAdminStatsAction', () => {
  function setupStatsMocks({
    totalMoves = 10,
    totalUsers = 5,
    newUsersThisWeek = 2,
    blockedUsers = 0,
    movesWithoutImage = 0,
    movesWithoutDescription = 0,
    movesWithoutTags = 0,
    totalTags = 3,
    totalFavourites = 20,
    totalProgress = 15,
    recentMoves = [] as unknown[],
    diffGroups = [] as { difficulty: string; _count: { _all: number } }[],
    topFavRaw = [] as { moveId: string; _count: { moveId: number } }[],
    recentUserGroups = [] as { day: Date; count: bigint }[],
    recentFavGroups = [] as { day: Date; count: bigint }[],
    topMoveDetails = [] as { id: string; title_en: string; title_pl: string }[],
  } = {}) {
    // Promise.all index order (must match actions.ts exactly):
    // 0  move.count()            → totalMoves
    // 1  user.count()            → totalUsers
    // 2  tag.count()             → totalTags
    // 3  userFavourite.count()   → totalFavourites
    // 4  userProgress.count()    → totalProgress
    // 5  user.count(createdAt)   → newUsersThisWeek
    // 6  user.count(blockedAt)   → blockedUsers
    // 7  move.count(imageUrl)    → movesWithoutImage
    // 8  move.count(description) → movesWithoutDescription
    // 9  move.count(tags)        → movesWithoutTags
    // 10 move.findMany()         → recentMoves
    // 11 move.groupBy()          → diffGroups
    // 12 userFavourite.groupBy() → topFavRaw
    // 13 $queryRaw GROUP BY day  → recentUserGroups
    // 14 $queryRaw GROUP BY day  → recentFavGroups
    mockMoveCount
      .mockResolvedValueOnce(totalMoves)
      .mockResolvedValueOnce(movesWithoutImage)
      .mockResolvedValueOnce(movesWithoutDescription)
      .mockResolvedValueOnce(movesWithoutTags);
    mockUserCount
      .mockResolvedValueOnce(totalUsers)
      .mockResolvedValueOnce(newUsersThisWeek)
      .mockResolvedValueOnce(blockedUsers);
    mockTagCount.mockResolvedValue(totalTags);
    mockUserFavouriteCount.mockResolvedValue(totalFavourites);
    mockUserProgressCount.mockResolvedValue(totalProgress);
    mockMoveFindMany.mockResolvedValueOnce(recentMoves);
    if (topFavRaw.length > 0) {
      mockMoveFindMany.mockResolvedValueOnce(topMoveDetails);
    }
    mockMoveGroupBy.mockResolvedValue(diffGroups);
    mockUserFavouriteGroupBy.mockResolvedValue(topFavRaw);
    mockQueryRaw.mockResolvedValueOnce(recentUserGroups).mockResolvedValueOnce(recentFavGroups);
  }

  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getAdminStatsAction()).rejects.toThrow('Unauthorized');
  });

  it('returns all 14 fields when ADMIN', async () => {
    mockAuth.mockResolvedValue(adminSession);
    setupStatsMocks({ totalMoves: 10, totalUsers: 5, totalTags: 3 });
    const result = await getAdminStatsAction();
    expect(result.totalMoves).toBe(10);
    expect(result.totalUsers).toBe(5);
    expect(result.totalTags).toBe(3);
    expect(result.totalFavourites).toBe(20);
    expect(result.totalProgress).toBe(15);
    expect(result.newUsersThisWeek).toBe(2);
    expect(result.blockedUsers).toBe(0);
    expect(result.activityData).toHaveLength(7);
    expect(result.recentMoves).toEqual([]);
    expect(result.topFavouritedMoves).toEqual([]);
  });

  it('maps difficultyDistribution correctly and defaults missing difficulty to 0', async () => {
    mockAuth.mockResolvedValue(adminSession);
    setupStatsMocks({
      diffGroups: [
        { difficulty: 'BEGINNER', _count: { _all: 4 } },
        { difficulty: 'ADVANCED', _count: { _all: 6 } },
        // INTERMEDIATE intentionally missing
      ],
    });
    const result = await getAdminStatsAction();
    expect(result.difficultyDistribution).toEqual({ BEGINNER: 4, INTERMEDIATE: 0, ADVANCED: 6 });
  });

  it('activityData has 7 entries each with an ISO date key', async () => {
    mockAuth.mockResolvedValue(adminSession);
    setupStatsMocks();
    const result = await getAdminStatsAction();
    expect(result.activityData).toHaveLength(7);
    result.activityData.forEach((entry) => {
      expect(entry.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.registrations).toBeGreaterThanOrEqual(0);
      expect(entry.favourites).toBeGreaterThanOrEqual(0);
    });
  });

  it('buckets registrations into the correct day', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
    setupStatsMocks({ recentUserGroups: [{ day: today, count: BigInt(1) }] });
    const result = await getAdminStatsAction();
    const todayEntry = result.activityData.find((e) => e.day === todayKey);
    expect(todayEntry?.registrations).toBe(1);
  });

  it('filters out topFavouritedMoves where move was deleted (race condition)', async () => {
    mockAuth.mockResolvedValue(adminSession);
    setupStatsMocks({
      topFavRaw: [{ moveId: 'deleted-move', _count: { moveId: 5 } }],
      topMoveDetails: [], // move not found — deleted between two queries
    });
    const result = await getAdminStatsAction();
    expect(result.topFavouritedMoves).toEqual([]);
  });

  it('returns topFavouritedMoves sorted by count descending', async () => {
    mockAuth.mockResolvedValue(adminSession);
    setupStatsMocks({
      topFavRaw: [
        { moveId: 'm-1', _count: { moveId: 10 } },
        { moveId: 'm-2', _count: { moveId: 3 } },
      ],
      topMoveDetails: [
        { id: 'm-1', title_en: 'Butterfly', title_pl: 'Motyl' },
        { id: 'm-2', title_en: 'Spin', title_pl: 'Spin PL' },
      ],
    });
    const result = await getAdminStatsAction();
    expect(result.topFavouritedMoves).toEqual([
      { id: 'm-1', title_en: 'Butterfly', title_pl: 'Motyl', count: 10 },
      { id: 'm-2', title_en: 'Spin', title_pl: 'Spin PL', count: 3 },
    ]);
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

describe('searchRelatedMovesAction', () => {
  it('throws Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(searchRelatedMovesAction({ query: 'spin' })).rejects.toThrow('Unauthorized');
    expect(mockMoveFindMany).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when role is not ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    await expect(searchRelatedMovesAction({ query: 'spin' })).rejects.toThrow('Unauthorized');
  });

  it('throws Invalid input when query is empty', async () => {
    mockAuth.mockResolvedValue(adminSession);
    await expect(searchRelatedMovesAction({ query: '' })).rejects.toThrow('Invalid input');
  });

  it('returns up to 20 results matching query with difficulty/category/favourites', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const rawMoves = [
      {
        id: 'm-1',
        title_en: 'Spin',
        title_pl: 'Spin PL',
        difficulty: 'BEGINNER',
        category: 'SPINS',
        _count: { favourites: 3 },
      },
    ];
    mockMoveFindMany.mockResolvedValue(rawMoves);
    const result = await searchRelatedMovesAction({ query: 'spin' });
    expect(mockMoveFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        select: expect.objectContaining({
          id: true,
          title_en: true,
          title_pl: true,
          difficulty: true,
          category: true,
        }),
      }),
    );
    expect(result).toEqual([
      {
        id: 'm-1',
        title_en: 'Spin',
        title_pl: 'Spin PL',
        difficulty: 'BEGINNER',
        category: 'SPINS',
        favourites: 3,
      },
    ]);
  });

  it('excludes the given move id when excludeId is provided', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    await searchRelatedMovesAction({ query: 'spin', excludeId: 'move-1' });
    const call = mockMoveFindMany.mock.calls[0][0];
    expect(call.where.AND[0]).toEqual({ id: { not: 'move-1' } });
  });

  it('does not add id exclusion when excludeId is omitted', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockMoveFindMany.mockResolvedValue([]);
    await searchRelatedMovesAction({ query: 'spin' });
    const call = mockMoveFindMany.mock.calls[0][0];
    expect(call.where.AND).toHaveLength(1);
    expect(call.where.AND[0]).toHaveProperty('OR');
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
