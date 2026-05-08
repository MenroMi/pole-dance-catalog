'use server';
import { Category, Difficulty, PoleType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/shared/lib/auth';
import { cloudinary } from '@/shared/lib/cloudinary';
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

const movesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  query: z.string().max(200).default(''),
  difficulty: z.enum(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('ALL'),
});

export async function getMovesForAdminAction(
  params: {
    page?: number;
    pageSize?: number;
    query?: string;
    difficulty?: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  } = {},
): Promise<{ moves: AdminMoveRow[]; total: number }> {
  await requireAdmin();
  const parsed = movesQuerySchema.safeParse(params);
  if (!parsed.success) throw new Error('Invalid input');
  const { page, pageSize, query, difficulty } = parsed.data;

  const searchCondition = query
    ? {
        OR: [
          { title_en: { contains: query, mode: 'insensitive' as const } },
          { title_pl: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const diffCondition = difficulty !== 'ALL' ? { difficulty: difficulty as Difficulty } : undefined;

  const conditions = [searchCondition, diffCondition].filter((c): c is NonNullable<typeof c> =>
    Boolean(c),
  );
  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [moves, total] = await Promise.all([
    prisma.move.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        title_en: true,
        title_pl: true,
        difficulty: true,
        category: true,
        createdAt: true,
        tags: { select: { id: true, name_en: true } },
        _count: { select: { favourites: true, progress: true } },
      },
    }),
    prisma.move.count({ where }),
  ]);

  return { moves, total };
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
        _count: { select: { favourites: true, progress: true } },
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
  const result = await prisma.tag.delete({ where: { id } });
  revalidatePath('/', 'layout');
  return result;
}

const usersQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  query: z.string().max(200).default(''),
  roleFilter: z.enum(['ALL', 'USER', 'ADMIN', 'BLOCKED']).default('ALL'),
});

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
  totalAll: number;
  totalAdmins: number;
  totalBlocked: number;
}> {
  await requireAdmin();
  const parsed = usersQuerySchema.safeParse(params);
  if (!parsed.success) throw new Error('Invalid input');
  const { page, pageSize, query, roleFilter } = parsed.data;

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
    blockReason: true,
    createdAt: true,
  };

  const [users, total, totalAll, totalAdmins, totalBlocked] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select,
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { blockedAt: { not: null } } }),
  ]);

  return { users, total, totalAll, totalAdmins, totalBlocked };
}

export async function changeUserRoleAction(userId: string, role: 'USER' | 'ADMIN') {
  const session = await requireAdmin();
  const parsedId = z.string().min(1).safeParse(userId);
  if (!parsedId.success) throw new Error('Invalid input');
  const parsedRole = z.enum(['USER', 'ADMIN']).safeParse(role);
  if (!parsedRole.success) throw new Error('Invalid input');
  if (session.user?.id === userId) throw new Error('Cannot change your own role');
  const result = await prisma.user.update({
    where: { id: userId },
    data: { role: parsedRole.data },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function blockUserAction(userId: string, reason?: string) {
  const session = await requireAdmin();
  const parsedId = z.string().min(1).safeParse(userId);
  if (!parsedId.success) throw new Error('Invalid input');
  const parsedReason = z.string().max(500).optional().safeParse(reason);
  if (!parsedReason.success) throw new Error('Invalid input');
  if (session.user?.id === userId) throw new Error('Cannot block yourself');
  const result = await prisma.user.update({
    where: { id: userId },
    data: { blockedAt: new Date(), blockReason: parsedReason.data ?? null },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function unblockUserAction(userId: string) {
  const session = await requireAdmin();
  const parsedId = z.string().min(1).safeParse(userId);
  if (!parsedId.success) throw new Error('Invalid input');
  if (session.user?.id === userId) throw new Error('Cannot unblock yourself');
  const result = await prisma.user.update({
    where: { id: userId },
    data: { blockedAt: null, blockReason: null },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function deleteUserAction(userId: string) {
  const session = await requireAdmin();
  const parsedId = z.string().min(1).safeParse(userId);
  if (!parsedId.success) throw new Error('Invalid input');
  if (session.user?.id === userId) throw new Error('Cannot delete yourself');
  const result = await prisma.user.delete({ where: { id: userId } });
  revalidatePath('/', 'layout');
  return result;
}

export async function uploadMoveImageAction(formData: FormData): Promise<{ imageUrl: string }> {
  await requireAdmin();
  const file = formData.get('image') as File | null;
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be under 5MB');
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'pole-dance-catalog/moves' }, (error, res) => {
        if (error || !res) reject(error ?? new Error('Upload failed'));
        else resolve(res as { secure_url: string });
      })
      .end(buffer);
  });
  return { imageUrl: result.secure_url };
}
