import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';

vi.mock('next/navigation', () => ({ notFound: vi.fn() }));
vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/features/moves', () => ({
  getMoveByIdAction: vi.fn(),
  getRelatedMovesAction: vi.fn(),
  MovePlayer: vi.fn(({ title }: { title: string }) => <div data-testid="player">{title}</div>),
}));
vi.mock('@/features/moves/components/MoveBreadcrumb', () => ({
  default: vi.fn(() => <nav data-testid="breadcrumb" />),
}));
vi.mock('@/features/moves/components/RelatedMoves', () => ({
  default: vi.fn(() => <div data-testid="related" />),
}));

import { auth } from '@/shared/lib/auth';
import { getMoveByIdAction, getRelatedMovesAction } from '@/features/moves';
import MoveDetailPage, { generateMetadata } from './page';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGetMove = getMoveByIdAction as ReturnType<typeof vi.fn>;
const mockGetRelated = getRelatedMovesAction as ReturnType<typeof vi.fn>;

const move = {
  id: 'move-1',
  title: 'Fireman Spin',
  category: 'SPINS',
  difficulty: 'BEGINNER',
  poleTypes: [],
  description: 'A graceful move.',
  gripType: 'Twisted',
  entry: null,
  duration: 'Short',
  youtubeUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
  imageUrl: null,
  stepsData: [],
  favourites: [],
  currentProgress: null,
  tags: [],
  coachNote: null,
  coachNoteAuthor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockGetMove.mockResolvedValue(move);
  mockGetRelated.mockResolvedValue([]);
});

describe('MoveDetailPage', () => {
  it('calls notFound when move does not exist', async () => {
    mockGetMove.mockResolvedValue(null);
    await MoveDetailPage({ params: Promise.resolve({ id: 'bad-id' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders MovePlayer with title', async () => {
    render(await MoveDetailPage({ params: Promise.resolve({ id: 'move-1' }) }));
    expect(screen.getByTestId('player')).toHaveTextContent('Fireman Spin');
  });

  it('renders RelatedMoves', async () => {
    render(await MoveDetailPage({ params: Promise.resolve({ id: 'move-1' }) }));
    expect(screen.getByTestId('related')).toBeInTheDocument();
  });
});

describe('generateMetadata', () => {
  it('returns title and description from move data', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ id: 'move-1' }) });
    expect(meta.title).toBe('Fireman Spin | Pole Dance Catalog');
    expect(meta.description).toBe('A graceful move.');
  });

  it('falls back to YouTube thumbnail for og:image when imageUrl is null', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ id: 'move-1' }) });
    expect((meta.openGraph as { images?: { url: string }[] })?.images?.[0]?.url).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });

  it('returns empty metadata when move does not exist', async () => {
    mockGetMove.mockResolvedValueOnce(null);
    const meta = await generateMetadata({ params: Promise.resolve({ id: 'bad-id' }) });
    expect(meta).toEqual({});
  });
});
