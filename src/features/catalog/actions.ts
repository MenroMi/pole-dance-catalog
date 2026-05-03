'use server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/shared/lib/prisma';
import { localizeMove, localizeTag } from '@/shared/lib/localize';
import type { Locale } from '@/i18n/routing';
import type { MoveFilters, PaginatedResult } from '@/shared/types';
import { Difficulty, PoleType } from '@/shared/types/enums';

import type { LocalizedMoveWithTags, LocalizedTag } from './types';

const moveFiltersSchema = z.object({
  poleTypes: z.array(z.nativeEnum(PoleType)).optional(),
  difficulty: z.array(z.nativeEnum(Difficulty)).optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

const ALL_POLE_TYPES = Object.values(PoleType);

function buildPoleTypeConditions(selected: PoleType[]): Prisma.MoveWhereInput[] {
  if (!selected.length) return [];
  const excluded = ALL_POLE_TYPES.filter((t) => !selected.includes(t));
  return [
    { poleTypes: { hasEvery: selected } },
    ...excluded.map((t) => ({ NOT: { poleTypes: { has: t } } })),
  ];
}

function buildTagConditions(tags: string[], locale: Locale): Prisma.MoveWhereInput[] {
  const nameField = locale === 'pl' ? 'name_pl' : 'name_en';
  return tags.map((tag) => ({ tags: { some: { [nameField]: tag } } }));
}

export async function getMovesAction(
  filters: MoveFilters = {},
  locale: Locale = 'pl',
): Promise<PaginatedResult<LocalizedMoveWithTags>> {
  const parsed = moveFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new Error('Invalid filters');
  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 12;

  const titleField = locale === 'pl' ? 'title_pl' : 'title_en';

  const andConditions = [
    ...buildPoleTypeConditions(parsed.data.poleTypes ?? []),
    ...buildTagConditions(parsed.data.tags ?? [], locale),
  ];

  const where = {
    ...(parsed.data.difficulty?.length && { difficulty: { in: parsed.data.difficulty } }),
    ...(parsed.data.search && {
      [titleField]: { contains: parsed.data.search, mode: 'insensitive' as const },
    }),
    ...(andConditions.length && { AND: andConditions }),
  };

  const [rawItems, total] = await prisma.$transaction([
    prisma.move.findMany({
      where,
      include: { tags: true },
      orderBy: { [titleField]: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.move.count({ where }),
  ]);

  const items = rawItems.map((move) => ({
    ...localizeMove(move as Parameters<typeof localizeMove>[0], locale),
    tags: move.tags.map((tag) => localizeTag(tag as Parameters<typeof localizeTag>[0], locale)),
  }));

  return { items, total, page, pageSize };
}

export async function getTagsAction(locale: Locale = 'pl'): Promise<LocalizedTag[]> {
  const tags = await prisma.tag.findMany({ orderBy: { name_pl: 'asc' } });
  return tags.map((tag) => localizeTag(tag as Parameters<typeof localizeTag>[0], locale));
}
