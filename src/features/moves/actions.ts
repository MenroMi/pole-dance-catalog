'use server';
import type { Locale } from '@/i18n/routing';
import { localizeMove, localizeTag } from '@/shared/lib/localize';
import { prisma } from '@/shared/lib/prisma';

import type { MoveDetail, StepItem } from './types';

export async function getMoveByIdAction(
  id: string,
  locale: Locale,
  userId?: string,
): Promise<MoveDetail | null> {
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

  const localized = localizeMove(move, locale);

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
    tags: move.tags.map((tag) => localizeTag(tag, locale)),
  };
}

export async function getRelatedMovesAction(tagIds: string[], excludeId: string, locale: Locale) {
  const select = {
    id: true,
    title_pl: true,
    title_en: true,
    difficulty: true,
    imageUrl: true,
    youtubeUrl: true,
  } as const;

  const explicit = await prisma.move.findUnique({
    where: { id: excludeId },
    select: { relatedMoves: { select }, relatedMovesOf: { select } },
  });

  const seen = new Set<string>();
  const explicitMoves = explicit
    ? [...explicit.relatedMoves, ...explicit.relatedMovesOf].filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
    : [];

  const moves =
    explicitMoves.length > 0
      ? explicitMoves
      : await prisma.move.findMany({
          where: { id: { not: excludeId }, tags: { some: { id: { in: tagIds } } } },
          select,
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
