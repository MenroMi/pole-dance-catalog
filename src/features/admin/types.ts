import type { Move, PoleType, User } from '@prisma/client';

export interface CreateMoveInput {
  title_pl: string;
  title_en: string;
  description_pl?: string;
  description_en?: string;
  difficulty: Move['difficulty'];
  category: Move['category'];
  poleTypes: PoleType[];
  youtubeUrl: string;
  imageUrl?: string | null;
  gripType_pl?: string;
  gripType_en?: string;
  entry_pl?: string;
  entry_en?: string;
  duration?: string;
  coachNote_pl?: string;
  coachNote_en?: string;
  coachNoteAuthor?: string;
  stepsData_pl: { text: string; timestamp?: number }[];
  stepsData_en: { text: string; timestamp?: number }[];
  tagIds: string[];
  relatedMoveIds: string[];
}

export interface UpdateMoveInput extends CreateMoveInput {
  id: string;
}

export interface AdminMoveRow {
  id: string;
  title_en: string;
  title_pl: string;
  difficulty: Move['difficulty'];
  category: Move['category'];
  createdAt: Date;
  tags: { id: string; name_en: string }[];
  _count: { favourites: number; progress: number };
}

export interface FullAdminMove {
  id: string;
  title_pl: string;
  title_en: string;
  description_pl: string | null;
  description_en: string | null;
  difficulty: Move['difficulty'];
  category: Move['category'];
  poleTypes: PoleType[];
  youtubeUrl: string;
  imageUrl: string | null;
  stepsData_pl: { text: string; timestamp?: number }[];
  stepsData_en: { text: string; timestamp?: number }[];
  gripType_pl: string | null;
  gripType_en: string | null;
  entry_pl: string | null;
  entry_en: string | null;
  duration: string | null;
  coachNote_pl: string | null;
  coachNote_en: string | null;
  coachNoteAuthor: string | null;
  tags: { id: string; name_en: string; name_pl: string }[];
  relatedMoves: {
    id: string;
    title_en: string;
    title_pl: string;
    difficulty: Move['difficulty'];
    category: Move['category'];
    favourites: number;
  }[];
}

export interface AdminTagRow {
  id: string;
  name_en: string;
  name_pl: string;
  color: string | null;
  _count: { moves: number };
}

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  location: string | null;
  role: User['role'];
  blockedAt: Date | null;
  blockReason: string | null;
  createdAt: Date;
}

export interface AdminStats {
  totalMoves: number;
  totalUsers: number;
  totalTags: number;
  recentMoves: AdminMoveRow[];
}

export interface CreateTagInput {
  name_en: string;
  name_pl: string;
  color?: string;
}

export interface UpdateTagInput extends CreateTagInput {
  id: string;
}
