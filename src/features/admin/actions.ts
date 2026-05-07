'use server';
import { Category, Difficulty, PoleType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

import type {
  AdminMoveRow,
  AdminStats,
  AdminTagRow,
  AdminUserRow,
  CreateMoveInput,
  CreateTagInput,
  FullAdminMove,
  UpdateMoveInput,
  UpdateTagInput,
} from './types';

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

const moveSchema = z.object({
  title_pl: z.string().min(1),
  title_en: z.string().min(1),
  description_pl: z.string().optional(),
  description_en: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty),
  category: z.nativeEnum(Category),
  poleTypes: z.array(z.nativeEnum(PoleType)).default([]),
  youtubeUrl: z.string().url(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  gripType_pl: z.string().optional(),
  gripType_en: z.string().optional(),
  entry_pl: z.string().optional(),
  entry_en: z.string().optional(),
  duration: z.string().optional(),
  coachNote_pl: z.string().optional(),
  coachNote_en: z.string().optional(),
  coachNoteAuthor: z.string().optional(),
  stepsData_pl: z.array(z.object({ time: z.number(), label: z.string() })).default([]),
  stepsData_en: z.array(z.object({ time: z.number(), label: z.string() })).default([]),
  tagIds: z.array(z.string()).default([]),
});

const tagSchema = z.object({
  name_en: z.string().min(1),
  name_pl: z.string().min(1),
  color: z.string().optional(),
});

export async function createMoveAction(input: CreateMoveInput) {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');
  const { tagIds, stepsData_pl, stepsData_en, poleTypes, ...data } = parsed.data;
  const result = await prisma.move.create({
    data: {
      ...data,
      poleTypes,
      stepsData_pl,
      stepsData_en,
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function updateMoveAction(input: UpdateMoveInput) {
  await requireAdmin();
  const { id, ...rest } = input;
  const parsed = moveSchema.safeParse(rest);
  if (!parsed.success) throw new Error('Invalid input');
  const { tagIds, stepsData_pl, stepsData_en, poleTypes, ...data } = parsed.data;
  const result = await prisma.move.update({
    where: { id },
    data: {
      ...data,
      poleTypes,
      stepsData_pl,
      stepsData_en,
      tags: { set: [], connect: tagIds.map((id) => ({ id })) },
    },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function deleteMoveAction(id: string) {
  await requireAdmin();
  const result = await prisma.move.delete({ where: { id } });
  revalidatePath('/', 'layout');
  return result;
}

export async function getMovesForAdminAction(): Promise<AdminMoveRow[]> {
  await requireAdmin();
  return prisma.move.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title_en: true,
      title_pl: true,
      difficulty: true,
      category: true,
      createdAt: true,
      tags: { select: { id: true, name_en: true } },
    },
  });
}

export async function getMoveByIdAction(id: string): Promise<FullAdminMove | null> {
  await requireAdmin();
  return prisma.move.findUnique({
    where: { id },
    include: { tags: { select: { id: true, name_en: true, name_pl: true } } },
  });
}

export async function getAdminStatsAction(): Promise<AdminStats> {
  await requireAdmin();
  const [totalMoves, totalUsers, totalTags, recentMoves] = await Promise.all([
    prisma.move.count(),
    prisma.user.count(),
    prisma.tag.count(),
    prisma.move.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title_en: true,
        title_pl: true,
        difficulty: true,
        category: true,
        createdAt: true,
        tags: { select: { id: true, name_en: true } },
      },
    }),
  ]);
  return { totalMoves, totalUsers, totalTags, recentMoves };
}

export async function getTagsForAdminAction(): Promise<AdminTagRow[]> {
  await requireAdmin();
  return prisma.tag.findMany({
    orderBy: { name_en: 'asc' },
    include: { _count: { select: { moves: true } } },
  });
}

export async function createTagAction(input: CreateTagInput) {
  await requireAdmin();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');
  return prisma.tag.create({ data: parsed.data });
}

export async function updateTagAction(input: UpdateTagInput) {
  await requireAdmin();
  const { id, ...rest } = input;
  const parsed = tagSchema.safeParse(rest);
  if (!parsed.success) throw new Error('Invalid input');
  return prisma.tag.update({ where: { id }, data: parsed.data });
}

export async function deleteTagAction(id: string) {
  await requireAdmin();
  return prisma.tag.delete({ where: { id } });
}

export async function getUsersForAdminAction(
  params: {
    page?: number;
    pageSize?: number;
    query?: string;
    roleFilter?: 'ALL' | 'USER' | 'ADMIN' | 'BLOCKED';
  } = {},
): Promise<{
  users: AdminUserRow[];
  total: number;
  totalAdmins: number;
  totalBlocked: number;
}> {
  await requireAdmin();
  const { page = 1, pageSize = 20, query = '', roleFilter = 'ALL' } = params;

  const searchCondition = query
    ? {
        OR: [
          { email: { contains: query, mode: 'insensitive' as const } },
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const roleCondition =
    roleFilter === 'ADMIN'
      ? { role: 'ADMIN' as const }
      : roleFilter === 'USER'
        ? { role: 'USER' as const }
        : roleFilter === 'BLOCKED'
          ? { blockedAt: { not: null } }
          : undefined;

  const conditions = [searchCondition, roleCondition].filter((c): c is NonNullable<typeof c> =>
    Boolean(c),
  );
  const where = conditions.length > 0 ? { AND: conditions } : {};

  const select = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    image: true,
    location: true,
    role: true,
    blockedAt: true,
    createdAt: true,
  };

  const [users, total, totalAdmins, totalBlocked] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { blockedAt: { not: null } } }),
  ]);

  return { users, total, totalAdmins, totalBlocked };
}

export async function changeUserRoleAction(userId: string, role: 'USER' | 'ADMIN') {
  const session = await requireAdmin();
  const parsedRole = z.enum(['USER', 'ADMIN']).safeParse(role);
  if (!parsedRole.success) throw new Error('Invalid input');
  if (session.user?.id === userId) throw new Error('Cannot change your own role');
  return prisma.user.update({ where: { id: userId }, data: { role: parsedRole.data } });
}

export async function blockUserAction(userId: string) {
  const session = await requireAdmin();
  if (session.user?.id === userId) throw new Error('Cannot block yourself');
  return prisma.user.update({ where: { id: userId }, data: { blockedAt: new Date() } });
}

export async function unblockUserAction(userId: string) {
  await requireAdmin();
  return prisma.user.update({ where: { id: userId }, data: { blockedAt: null } });
}

export async function deleteUserAction(userId: string) {
  const session = await requireAdmin();
  if (session.user?.id === userId) throw new Error('Cannot delete yourself');
  return prisma.user.delete({ where: { id: userId } });
}
