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
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { blockedAt: true },
  });
  if (!dbUser || dbUser.blockedAt) {
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
  youtubeUrl: z
    .string()
    .url()
    .refine(
      (v) => /^https:\/\/(www\.youtube\.com|youtube\.com|youtu\.be)\//.test(v),
      'Must be a YouTube URL',
    ),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' || v == null ? null : v)),
  gripType_pl: z.string().optional(),
  gripType_en: z.string().optional(),
  entry_pl: z.string().optional(),
  entry_en: z.string().optional(),
  duration: z.string().optional(),
  coachNote_pl: z.string().optional(),
  coachNote_en: z.string().optional(),
  coachNoteAuthor: z.string().optional(),
  stepsData_pl: z
    .array(z.object({ text: z.string(), timestamp: z.number().optional() }))
    .default([]),
  stepsData_en: z
    .array(z.object({ text: z.string(), timestamp: z.number().optional() }))
    .default([]),
  tagIds: z.array(z.string()).min(1).default([]),
  relatedMoveIds: z.array(z.string()).default([]),
});

const tagSchema = z.object({
  name_en: z.string().min(1),
  name_pl: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function createMoveAction(input: CreateMoveInput) {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    console.error('[createMoveAction] validation failed:', parsed.error.flatten());
    throw new Error('Invalid input');
  }
  const { tagIds, relatedMoveIds, stepsData_pl, stepsData_en, poleTypes, ...data } = parsed.data;
  const result = await prisma.move.create({
    data: {
      ...data,
      poleTypes,
      stepsData_pl,
      stepsData_en,
      tags: { connect: tagIds.map((id) => ({ id })) },
      relatedMoves: { connect: relatedMoveIds.map((id) => ({ id })) },
    },
  });
  revalidatePath('/', 'layout');
  return result;
}

export async function updateMoveAction(input: UpdateMoveInput) {
  await requireAdmin();
  const { id, ...rest } = input;
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) throw new Error('Invalid input');
  const parsed = moveSchema.safeParse(rest);
  if (!parsed.success) {
    console.error('[updateMoveAction] validation failed:', parsed.error.flatten());
    throw new Error('Invalid input');
  }
  const { tagIds, relatedMoveIds, stepsData_pl, stepsData_en, poleTypes, ...data } = parsed.data;

  const current = await prisma.move.findUnique({
    where: { id: parsedId.data },
    select: { imageUrl: true },
  });

  const result = await prisma.move.update({
    where: { id: parsedId.data },
    data: {
      ...data,
      poleTypes,
      stepsData_pl,
      stepsData_en,
      tags: { set: [], connect: tagIds.map((id) => ({ id })) },
      relatedMoves: { set: [], connect: relatedMoveIds.map((id) => ({ id })) },
    },
  });

  // best-effort: DB write already succeeded, Cloudinary failure must not roll it back
  if (current?.imageUrl && current.imageUrl !== data.imageUrl) {
    try {
      await destroyCloudinaryImage(current.imageUrl);
    } catch {
      // destroyCloudinaryImage logs internally; swallow here to protect the caller
    }
  }

  revalidatePath('/', 'layout');
  return result;
}

export async function deleteMoveAction(id: string) {
  await requireAdmin();
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) throw new Error('Invalid input');

  const current = await prisma.move.findUnique({
    where: { id: parsedId.data },
    select: { imageUrl: true },
  });

  const result = await prisma.move.delete({ where: { id: parsedId.data } });

  // best-effort: DB row already deleted, Cloudinary failure must not surface to caller
  if (current?.imageUrl) {
    try {
      await destroyCloudinaryImage(current.imageUrl);
    } catch {
      // destroyCloudinaryImage logs internally; swallow here to protect the caller
    }
  }

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
): Promise<{ moves: AdminMoveRow[]; total: number; totalAll: number }> {
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

  const [moves, total, totalAll] = await Promise.all([
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
    prisma.move.count(),
  ]);

  return { moves, total, totalAll };
}

export async function getMoveByIdAction(id: string): Promise<FullAdminMove | null> {
  await requireAdmin();
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) throw new Error('Invalid input');
  const result = await prisma.move.findUnique({
    where: { id: parsedId.data },
    include: {
      tags: { select: { id: true, name_en: true, name_pl: true } },
      relatedMoves: {
        select: {
          id: true,
          title_en: true,
          title_pl: true,
          difficulty: true,
          category: true,
          _count: { select: { favourites: true } },
        },
      },
    },
  });
  if (!result) return null;
  // stepsData_en/pl are Json in Prisma but always stored as StepData[] by this app
  type StepData = { text: string; timestamp?: number };
  return {
    ...result,
    stepsData_en: (result.stepsData_en ?? []) as StepData[],
    stepsData_pl: (result.stepsData_pl ?? []) as StepData[],
    relatedMoves: (result.relatedMoves ?? []).map((m) => ({
      id: m.id,
      title_en: m.title_en,
      title_pl: m.title_pl,
      difficulty: m.difficulty,
      category: m.category,
      favourites: m._count.favourites,
    })),
  } satisfies FullAdminMove;
}

export async function searchRelatedMovesAction(params: {
  query: string;
  excludeId?: string;
}): Promise<
  {
    id: string;
    title_en: string;
    title_pl: string;
    difficulty: string;
    category: string;
    favourites: number;
  }[]
> {
  await requireAdmin();
  const parsed = z
    .object({ query: z.string().min(1).max(200), excludeId: z.string().optional() })
    .safeParse(params);
  if (!parsed.success) throw new Error('Invalid input');
  const { query, excludeId } = parsed.data;
  const moves = await prisma.move.findMany({
    where: {
      AND: [
        ...(excludeId ? [{ id: { not: excludeId } }] : []),
        {
          OR: [
            { title_en: { contains: query, mode: 'insensitive' as const } },
            { title_pl: { contains: query, mode: 'insensitive' as const } },
          ],
        },
      ],
    },
    orderBy: { title_en: 'asc' },
    take: 20,
    select: {
      id: true,
      title_en: true,
      title_pl: true,
      difficulty: true,
      category: true,
      _count: { select: { favourites: true } },
    },
  });
  return moves.map((m) => ({
    id: m.id,
    title_en: m.title_en,
    title_pl: m.title_pl,
    difficulty: m.difficulty,
    category: m.category,
    favourites: m._count.favourites,
  }));
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
  const result = await prisma.tag.create({ data: parsed.data });
  revalidatePath('/', 'layout');
  return result;
}

export async function updateTagAction(input: UpdateTagInput) {
  await requireAdmin();
  const { id, ...rest } = input;
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) throw new Error('Invalid input');
  const parsed = tagSchema.safeParse(rest);
  if (!parsed.success) throw new Error('Invalid input');
  const result = await prisma.tag.update({ where: { id: parsedId.data }, data: parsed.data });
  revalidatePath('/', 'layout');
  return result;
}

export async function deleteTagAction(id: string) {
  await requireAdmin();
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) throw new Error('Invalid input');
  const result = await prisma.tag.delete({ where: { id: parsedId.data } });
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
    where: { id: parsedId.data },
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
    where: { id: parsedId.data },
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
    where: { id: parsedId.data },
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
  const result = await prisma.user.delete({ where: { id: parsedId.data } });
  revalidatePath('/', 'layout');
  return result;
}

function extractCloudinaryPublicId(url: string): string | null {
  // Parses /upload/[v<version>/]<public_id>.<ext> — no transformation segments expected
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return match?.[1] ?? null;
}

async function destroyCloudinaryImage(url: string): Promise<void> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId).catch((err) => {
    console.error('[Cloudinary] destroy failed for public_id:', publicId, err);
  });
}

export async function deleteUploadedImageAction(url: string): Promise<void> {
  await requireAdmin();
  if (
    !url.startsWith('https://res.cloudinary.com/') ||
    !url.includes('/pole-dance-catalog/moves/')
  ) {
    throw new Error('Invalid image URL');
  }
  await destroyCloudinaryImage(url);
}

function isImageBuffer(buf: Buffer): boolean {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // PNG
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true; // GIF
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return true; // WebP
  return false;
}

export async function uploadMoveImageAction(formData: FormData): Promise<{ imageUrl: string }> {
  await requireAdmin();
  const file = formData.get('image') as File | null;
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be under 5MB');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isImageBuffer(buffer)) throw new Error('Only image files are allowed');
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
