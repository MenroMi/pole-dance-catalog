'use server';
import { prisma } from '@/shared/lib/prisma';
import { localizeMove, localizeTag } from '@/shared/lib/localize';
import type { Locale } from '@/i18n/routing';

import type { MoveDetail, StepItem } from './types';

export async function getMoveByIdAction(id: string, locale: Locale, userId?: string): Promise<MoveDetail | null> {
  const move = await prisma.move.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!move) return null;

  const [favourites, progressRecord] = await Promise.all([
    userId ? prisma.userFavourite.findMany({ where: { userId, moveId: id } }) : Promise.resolve([]),
    userId
      ? prisma.userProgress.findFirst({ where: { userId, moveId: id } })
      : Promise.resolve(null),
  ]);

  const localized = localizeMove(move as Parameters<typeof localizeMove>[0], locale);

  const stepsData = (Array.isArray(localized.stepsData) ? localized.stepsData : []).filter(
    (s): s is StepItem => {
      if (typeof s !== 'object' || s === null || Array.isArray(s)) return false;
      const obj = s as Record<string, unknown>;
      return (
        typeof obj.text === 'string' &&
        (obj.timestamp === undefined || typeof obj.timestamp === 'number')
      );
    },
  );

  return {
    ...localized,
    favourites,
    stepsData,
    currentProgress: progressRecord?.status ?? null,
    tags: move.tags.map((tag) => localizeTag(tag as Parameters<typeof localizeTag>[0], locale)),
  };
}

export async function getRelatedMovesAction(tagIds: string[], excludeId: string, locale: Locale) {
  const moves = await prisma.move.findMany({
    where: {
      id: { not: excludeId },
      tags: { some: { id: { in: tagIds } } },
    },
    select: {
      id: true,
      title_pl: true,
      title_en: true,
      difficulty: true,
      imageUrl: true,
      youtubeUrl: true,
    },
    take: 4,
  });
  const pl = locale === 'pl';
  return moves.map((move) => ({
    id: move.id,
    title: pl ? move.title_pl : move.title_en,
    difficulty: move.difficulty,
    imageUrl: move.imageUrl,
    youtubeUrl: move.youtubeUrl,
  }));
}
