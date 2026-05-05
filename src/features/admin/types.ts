import type { Move } from '@prisma/client';

export interface CreateMoveInput {
  title_pl: string;
  title_en: string;
  description_pl?: string;
  description_en?: string;
  difficulty: Move['difficulty'];
  category: Move['category'];
  youtubeUrl: string;
  imageUrl?: string;
  tags?: string[];
}
