import type { UserProgress, UserFavourite } from '@prisma/client';

import type { LocalizedMove, LocalizedTag } from '@/shared/lib/localize';

export type ProgressWithMove = UserProgress & { move: LocalizedMove };
export type FavouriteWithMove = UserFavourite & { move: LocalizedMove & { tags: LocalizedTag[] } };

export type ProfileFormValues = {
  name: string;
};

export type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
