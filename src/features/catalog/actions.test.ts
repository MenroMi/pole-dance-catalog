import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    move: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/shared/lib/localize', () => ({
  localizeMove: vi.fn((move: Record<string, unknown>) => move),
  localizeTag: vi.fn((tag: Record<string, unknown>) => tag),
}));

import { prisma } from '@/shared/lib/prisma';

import { getMovesAction, getTagsAction } from './actions';

const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.move.findMany as ReturnType<typeof vi.fn>;
const mockCount = prisma.move.count as ReturnType<typeof vi.fn>;
const mockTagFindMany = prisma.tag.findMany as ReturnType<typeof vi.fn>;

const mockMoves = [
  {
    id: 'm1',
    title: 'Jade',
    difficulty: 'BEGINNER',
    poleTypes: ['STATIC'],
    tags: [],
    coachNote: null,
    coachNoteAuthor: null,
  },
  {
    id: 'm2',
    title: 'Iguana',
    difficulty: 'INTERMEDIATE',
    poleTypes: ['SPIN'],
    tags: [],
    coachNote: null,
    coachNoteAuthor: null,
  },
];

beforeEach(() => vi.clearAllMocks());

describe('getMovesAction', () => {
  it('throws when search exceeds 100 characters', async () => {
    await expect(getMovesAction({ search: 'a'.repeat(101) }, 'pl')).rejects.toThrow('Invalid filters');
  });

  it('throws when difficulty contains invalid enum value', async () => {
    await expect(getMovesAction({ difficulty: ['INVALID' as 'BEGINNER'] }, 'pl')).rejects.toThrow(
      'Invalid filters',
    );
  });

  it('throws when pageSize exceeds 100', async () => {
    await expect(getMovesAction({ pageSize: 101 }, 'pl')).rejects.toThrow('Invalid filters');
  });

  it('returns PaginatedResult shape with defaults page=1 pageSize=12', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    const result = await getMovesAction({}, 'pl');
    expect(result).toEqual({ items: mockMoves, total: 2, page: 1, pageSize: 12 });
  });

  it('applies skip=(page-1)*pageSize and take=pageSize for page 2', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 24]);
    await getMovesAction({ page: 2, pageSize: 12 }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 12, take: 12 }));
  });

  it('does not add AND when poleTypes is empty', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ poleTypes: [] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ AND: expect.anything() }),
      }),
    );
  });

  it('filters STATIC-only: hasEvery STATIC + NOT has SPIN', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ poleTypes: ['STATIC'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { poleTypes: { hasEvery: ['STATIC'] } },
            { NOT: { poleTypes: { has: 'SPIN' } } },
          ]),
        }),
      }),
    );
  });

  it('filters SPIN-only: hasEvery SPIN + NOT has STATIC', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[1]], 1]);
    await getMovesAction({ poleTypes: ['SPIN'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { poleTypes: { hasEvery: ['SPIN'] } },
            { NOT: { poleTypes: { has: 'STATIC' } } },
          ]),
        }),
      }),
    );
  });

  it('filters STATIC+SPIN (universal): hasEvery both, no exclusions', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ poleTypes: ['STATIC', 'SPIN'] }, 'pl');
    const call = mockFindMany.mock.calls[0][0] as { where: { AND: object[] } };
    expect(call.where.AND).toContainEqual({ poleTypes: { hasEvery: ['STATIC', 'SPIN'] } });
    expect(call.where.AND).not.toContainEqual(expect.objectContaining({ NOT: expect.anything() }));
  });

  it('filters by difficulty with { in: [...] }', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ difficulty: ['BEGINNER'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficulty: { in: ['BEGINNER'] } }),
      }),
    );
  });

  it('filters by multiple difficulties (OR logic)', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ difficulty: ['BEGINNER', 'INTERMEDIATE'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficulty: { in: ['BEGINNER', 'INTERMEDIATE'] } }),
      }),
    );
  });

  it('does not add difficulty to where when array is empty', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ difficulty: [] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ difficulty: expect.anything() }),
      }),
    );
  });

  it('filters tags with AND: each tag must be present (pl uses name_pl)', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ tags: ['aerial', 'flexibility'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { tags: { some: { name_pl: 'aerial' } } },
            { tags: { some: { name_pl: 'flexibility' } } },
          ]),
        }),
      }),
    );
  });

  it('filters tags with name_en when locale is en', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ tags: ['aerial'] }, 'en');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { tags: { some: { name_en: 'aerial' } } },
          ]),
        }),
      }),
    );
  });

  it('single tag produces single AND condition', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ tags: ['aerial'] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ tags: { some: { name_pl: 'aerial' } } }]),
        }),
      }),
    );
  });

  it('does not add AND when tags is empty', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ tags: [] }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ AND: expect.anything() }),
      }),
    );
  });

  it('includes poleType AND conditions when poleTypes non-empty but tags empty', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ poleTypes: ['STATIC'], tags: [] }, 'pl');
    const call = mockFindMany.mock.calls[0][0] as { where: { AND: object[] } };
    expect(call.where.AND).toContainEqual({ poleTypes: { hasEvery: ['STATIC'] } });
    expect(call.where.AND).not.toContainEqual(expect.objectContaining({ tags: expect.anything() }));
  });

  it('merges poleTypes and tags into a single AND array', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    await getMovesAction({ poleTypes: ['STATIC'], tags: ['aerial'] }, 'pl');
    const call = mockFindMany.mock.calls[0][0] as { where: { AND: object[] } };
    expect(call.where.AND).toContainEqual({ poleTypes: { hasEvery: ['STATIC'] } });
    expect(call.where.AND).toContainEqual({ tags: { some: { name_pl: 'aerial' } } });
  });

  it('filters by search with case-insensitive title_pl match when locale is pl', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ search: 'jade' }, 'pl');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title_pl: { contains: 'jade', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('total reflects filtered count not all moves', async () => {
    mockTransaction.mockResolvedValue([[mockMoves[0]], 1]);
    const result = await getMovesAction({ poleTypes: ['STATIC'] }, 'pl');
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('count uses same where clause as findMany', async () => {
    mockTransaction.mockResolvedValue([mockMoves, 2]);
    await getMovesAction({ poleTypes: ['STATIC'], difficulty: ['BEGINNER'] }, 'pl');
    const findManyWhere = (mockFindMany.mock.calls[0][0] as { where: object }).where;
    const countWhere = (mockCount.mock.calls[0][0] as { where: object }).where;
    expect(findManyWhere).toEqual(countWhere);
  });
});

describe('getTagsAction', () => {
  it('returns tags ordered by name_pl', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'aerial', color: '#3b82f6' },
      { id: 'tag-2', name: 'flexibility', color: '#a855f7' },
    ];
    mockTagFindMany.mockResolvedValue(mockTags);
    const result = await getTagsAction('pl');
    expect(result).toEqual(mockTags);
    expect(mockTagFindMany).toHaveBeenCalledWith({ orderBy: { name_pl: 'asc' } });
  });

  it('returns empty array when no tags exist', async () => {
    mockTagFindMany.mockResolvedValue([]);
    const result = await getTagsAction('pl');
    expect(result).toEqual([]);
  });

  it('includes color field in returned shape', async () => {
    mockTagFindMany.mockResolvedValue([{ id: 'tag-1', name: 'aerial', color: '#3b82f6' }]);
    const [tag] = await getTagsAction('pl');
    expect(tag).toHaveProperty('color');
  });
});
