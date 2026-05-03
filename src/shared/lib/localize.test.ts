import { describe, it, expect } from 'vitest';
import { localizeMove, localizeTag } from './localize';
import type { RawMove, RawTag } from './localize';

const baseMove: RawMove = {
  id: 'm1',
  title_pl: 'Spin Strażaka',
  title_en: 'Fireman Spin',
  description_pl: 'Opis PL',
  description_en: 'Desc EN',
  stepsData_pl: [{ text: 'Krok PL' }],
  stepsData_en: [{ text: 'Step EN' }],
  gripType_pl: 'Chwyt PL',
  gripType_en: 'Grip EN',
  entry_pl: 'Wejście PL',
  entry_en: 'Entry EN',
  coachNote_pl: 'Notatka PL',
  coachNote_en: 'Note EN',
  coachNoteAuthor: 'Coach',
  difficulty: 'BEGINNER',
  category: 'SPINS',
  poleTypes: [],
  youtubeUrl: 'https://youtube.com',
  imageUrl: null,
  duration: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseTag: RawTag = {
  id: 't1',
  name_pl: 'Aerial',
  name_en: 'Aerial EN',
  color: '#8b5cf6',
};

describe('localizeMove', () => {
  it('returns Polish fields when locale is pl', () => {
    const result = localizeMove(baseMove, 'pl');
    expect(result.title).toBe('Spin Strażaka');
    expect(result.description).toBe('Opis PL');
    expect(result.stepsData).toEqual([{ text: 'Krok PL' }]);
    expect(result.gripType).toBe('Chwyt PL');
    expect(result.entry).toBe('Wejście PL');
    expect(result.coachNote).toBe('Notatka PL');
  });

  it('returns English fields when locale is en', () => {
    const result = localizeMove(baseMove, 'en');
    expect(result.title).toBe('Fireman Spin');
    expect(result.description).toBe('Desc EN');
    expect(result.stepsData).toEqual([{ text: 'Step EN' }]);
    expect(result.gripType).toBe('Grip EN');
    expect(result.entry).toBe('Entry EN');
    expect(result.coachNote).toBe('Note EN');
  });

  it('preserves non-translatable fields', () => {
    const result = localizeMove(baseMove, 'en');
    expect(result.id).toBe('m1');
    expect(result.coachNoteAuthor).toBe('Coach');
    expect(result.difficulty).toBe('BEGINNER');
    expect(result.youtubeUrl).toBe('https://youtube.com');
  });

  it('passes through null optional fields for pl locale', () => {
    const move = { ...baseMove, description_pl: null, gripType_pl: null, coachNote_pl: null };
    const result = localizeMove(move, 'pl');
    expect(result.description).toBeNull();
    expect(result.gripType).toBeNull();
    expect(result.coachNote).toBeNull();
  });

  it('passes through null optional fields for en locale', () => {
    const move = { ...baseMove, description_en: null, entry_en: null, coachNote_en: null };
    const result = localizeMove(move, 'en');
    expect(result.description).toBeNull();
    expect(result.entry).toBeNull();
    expect(result.coachNote).toBeNull();
  });

  it('handles empty stepsData arrays', () => {
    const move = { ...baseMove, stepsData_pl: [], stepsData_en: [] };
    expect(localizeMove(move, 'pl').stepsData).toEqual([]);
    expect(localizeMove(move, 'en').stepsData).toEqual([]);
  });
});

describe('localizeTag', () => {
  it('returns name_pl when locale is pl', () => {
    const result = localizeTag(baseTag, 'pl');
    expect(result.name).toBe('Aerial');
    expect(result.id).toBe('t1');
    expect(result.color).toBe('#8b5cf6');
  });

  it('returns name_en when locale is en', () => {
    const result = localizeTag(baseTag, 'en');
    expect(result.name).toBe('Aerial EN');
  });
});
