import type { UserFavourite } from '@prisma/client';
import type { LocalizedMove, LocalizedTag } from '@/shared/lib/localize';
import type { LearnStatus } from '@/shared/types';

export type StepItem = { text: string; timestamp?: number };

export type MoveDetail = Omit<LocalizedMove, 'stepsData'> & {
  favourites: UserFavourite[];
  stepsData: StepItem[];
  currentProgress: LearnStatus | null;
  tags: LocalizedTag[];
};
