'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { applyPasswordComplexity } from '@/features/auth/lib/validation';
import { locales, defaultLocale } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { auth } from '@/shared/lib/auth';
import { cloudinary } from '@/shared/lib/cloudinary';
import { localizeMove, localizeTag } from '@/shared/lib/localize';
import { prisma } from '@/shared/lib/prisma';
import type { LearnStatus } from '@/shared/types';

import { profileSchema } from './lib/validation';
import type { FavouriteWithMove, ProgressWithMove } from './types';

async function getCheckedLocale(): Promise<Locale> {
  const raw = await getLocale();
  return (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100).superRefine(applyPasswordComplexity),
});

export async function getUserProgressAction(status?: LearnStatus): Promise<ProgressWithMove[]> {
  const [userId, locale] = await Promise.all([requireAuth(), getCheckedLocale()]);
  const results = await prisma.userProgress.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { move: true },
  });
  return results.map((p) => ({
    ...p,
    move: localizeMove(p.move, locale),
  }));
}

export async function updateProgressAction(moveId: string, status: LearnStatus) {
  const userId = await requireAuth();
  const result = await prisma.userProgress.upsert({
    where: { userId_moveId: { userId, moveId } },
    create: { userId, moveId, status },
    update: { status },
  });
  revalidatePath('/profile');
  revalidatePath('/profile/progress');
  revalidatePath('/moves/' + moveId);
  return result;
}

export async function removeProgressAction(moveId: string) {
  const userId = await requireAuth();
  await prisma.userProgress.deleteMany({ where: { userId, moveId } });
  revalidatePath('/profile');
  revalidatePath('/profile/progress');
  revalidatePath('/moves/' + moveId);
}

export async function updateProfileAction(data: {
  firstName: string;
  lastName: string;
  location?: string | null;
}) {
  const userId = await requireAuth();
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: 'Invalid input' };

  const updateData: { firstName: string; lastName: string; location?: string | null } = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  };
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;

  await prisma.user.update({ where: { id: userId }, data: updateData });
  return { success: true as const };
}

export async function uploadAvatarAction(formData: FormData) {
  const userId = await requireAuth();
  const file = formData.get('avatar') as File | null;
  if (!file) return { success: false as const, error: 'No file provided' };
  if (!file.type.startsWith('image/'))
    return { success: false as const, error: 'Only image files are allowed' };
  if (file.size > 5 * 1024 * 1024)
    return { success: false as const, error: 'File size must be under 5MB' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'pole-dance-catalog/avatars', public_id: `user-${userId}`, overwrite: true },
        (error, res) => {
          if (error || !res) reject(error ?? new Error('Upload failed'));
          else resolve(res as { secure_url: string });
        },
      )
      .end(buffer);
  });

  await prisma.user.update({ where: { id: userId }, data: { image: result.secure_url } });
  return { success: true as const, imageUrl: result.secure_url };
}

export async function changePasswordAction(data: { currentPassword: string; newPassword: string }) {
  const userId = await requireAuth();
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: 'Invalid input' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user?.password)
    return { success: false as const, error: 'Password change is not available' };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { success: false as const, error: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { success: true as const };
}

export async function addFavouriteAction(moveId: string) {
  const userId = await requireAuth();
  await prisma.userFavourite.upsert({
    where: { userId_moveId: { userId, moveId } },
    create: { userId, moveId },
    update: {},
  });
  revalidatePath('/profile/favourite-moves');
  revalidatePath('/profile');
  revalidatePath('/moves/' + moveId);
  return { success: true as const };
}

export async function removeFavouriteAction(moveId: string) {
  const userId = await requireAuth();
  await prisma.userFavourite.deleteMany({
    where: { userId, moveId },
  });
  revalidatePath('/profile/favourite-moves');
  revalidatePath('/profile');
  revalidatePath('/moves/' + moveId);
  return { success: true as const };
}

export async function getUserFavouritesAction(): Promise<FavouriteWithMove[]> {
  const [userId, locale] = await Promise.all([requireAuth(), getCheckedLocale()]);
  const results = await prisma.userFavourite.findMany({
    where: { userId },
    include: { move: { include: { tags: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return results.map((f) => ({
    ...f,
    move: {
      ...localizeMove(f.move, locale),
      tags: f.move.tags.map((tag) => localizeTag(tag, locale)),
    },
  }));
}

export async function getProfileUserAction() {
  const userId = await requireAuth();
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      image: true,
      location: true,
      createdAt: true,
    },
  });
}

export async function getProfileSettingsAction() {
  const userId = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, image: true, location: true, password: true },
  });
  if (!user) return null;
  const { password, ...profile } = user;
  return { ...profile, hasPassword: password != null };
}

export async function getProfileStatsAction() {
  const userId = await requireAuth();
  const [masteredCount, favouritesCount] = await Promise.all([
    prisma.userProgress.count({ where: { userId, status: 'LEARNED' } }),
    prisma.userFavourite.count({ where: { userId } }),
  ]);
  return { masteredCount, favouritesCount };
}

export async function getProfileOverviewAction() {
  const [userId, locale] = await Promise.all([requireAuth(), getCheckedLocale()]);
  const [progressGroups, currentlyLearning, favouritesPreview, favouritesCount, user] =
    await Promise.all([
      prisma.userProgress.groupBy({ by: ['status'], where: { userId }, _count: true }),
      prisma.userProgress.findMany({
        where: { userId, status: 'IN_PROGRESS' },
        include: { move: { include: { tags: true } } },
        orderBy: { id: 'desc' },
      }),
      prisma.userFavourite.findMany({
        where: { userId },
        include: { move: { include: { tags: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.userFavourite.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
          image: true,
          location: true,
          createdAt: true,
        },
      }),
    ]);

  const breakdown = { learned: 0, inProgress: 0, wantToLearn: 0 };
  for (const g of progressGroups) {
    if (g.status === 'LEARNED') breakdown.learned = g._count;
    if (g.status === 'IN_PROGRESS') breakdown.inProgress = g._count;
    if (g.status === 'WANT_TO_LEARN') breakdown.wantToLearn = g._count;
  }

  return {
    user,
    stats: {
      masteredCount: breakdown.learned,
      inProgressCount: breakdown.inProgress,
      favouritesCount,
    },
    breakdown,
    currentlyLearning: currentlyLearning.map((p) => ({
      ...p,
      move: {
        ...localizeMove(p.move, locale),
        tags: p.move.tags.map((tag) => localizeTag(tag, locale)),
      },
    })),
    favouritesPreview: favouritesPreview.map((f) => ({
      ...f,
      move: {
        ...localizeMove(f.move, locale),
        tags: f.move.tags.map((tag) => localizeTag(tag, locale)),
      },
    })),
  };
}
