import type { Locale } from '@/i18n/routing';

export type RawMove = {
  id: string;
  title_pl: string;
  title_en: string;
  description_pl: string | null;
  description_en: string | null;
  stepsData_pl: unknown;
  stepsData_en: unknown;
  gripType_pl: string | null;
  gripType_en: string | null;
  entry_pl: string | null;
  entry_en: string | null;
  coachNote_pl: string | null;
  coachNote_en: string | null;
  coachNoteAuthor: string | null;
  difficulty: string;
  category: string;
  poleTypes: string[];
  youtubeUrl: string;
  imageUrl: string | null;
  duration: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RawTag = {
  id: string;
  name_pl: string;
  name_en: string;
  color: string | null;
};

export type LocalizedMove = Omit<
  RawMove,
  | 'title_pl' | 'title_en'
  | 'description_pl' | 'description_en'
  | 'stepsData_pl' | 'stepsData_en'
  | 'gripType_pl' | 'gripType_en'
  | 'entry_pl' | 'entry_en'
  | 'coachNote_pl' | 'coachNote_en'
> & {
  title: string;
  description: string | null;
  stepsData: unknown;
  gripType: string | null;
  entry: string | null;
  coachNote: string | null;
};

export type LocalizedTag = Omit<RawTag, 'name_pl' | 'name_en'> & { name: string };

export function localizeMove(move: RawMove, locale: Locale): LocalizedMove {
  const pl = locale === 'pl';
  const {
    title_pl, title_en,
    description_pl, description_en,
    stepsData_pl, stepsData_en,
    gripType_pl, gripType_en,
    entry_pl, entry_en,
    coachNote_pl, coachNote_en,
    ...rest
  } = move;
  return {
    ...rest,
    title: pl ? title_pl : title_en,
    description: pl ? description_pl : description_en,
    stepsData: pl ? stepsData_pl : stepsData_en,
    gripType: pl ? gripType_pl : gripType_en,
    entry: pl ? entry_pl : entry_en,
    coachNote: pl ? coachNote_pl : coachNote_en,
  };
}

export function localizeTag(tag: RawTag, locale: Locale): LocalizedTag {
  const { name_pl, name_en, ...rest } = tag;
  return { ...rest, name: locale === 'pl' ? name_pl : name_en };
}
