import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const scrollToMock = vi.fn();
vi.stubGlobal('scrollTo', scrollToMock);

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock('./MoveHero', () => ({
  default: vi.fn(({ seekRequest }: { seekRequest?: { seconds: number } }) => (
    <div data-testid="move-hero" data-seek-to={seekRequest?.seconds ?? ''} />
  )),
}));

vi.mock('./MoveBreakdown', () => ({
  default: vi.fn(({ onSeek }: { onSeek: (s: number) => void }) => (
    <button type="button" onClick={() => onSeek(45)}>
      seek
    </button>
  )),
}));

vi.mock('./MoveTabs', () => ({
  default: vi.fn(({ breakdown }: { breakdown: React.ReactNode }) => <>{breakdown}</>),
}));

vi.mock('./MoveFavouriteButton', () => ({
  default: vi.fn(() => <button type="button">favourite</button>),
}));

vi.mock('./MoveProgressPicker', () => ({
  MoveProgressPicker: vi.fn(() => <div data-testid="progress-picker" />),
}));

vi.mock('./MoveSpecs', () => ({
  default: vi.fn(() => <div data-testid="move-specs" />),
}));

import type { StepItem } from '../types';
import MovePlayer from './MovePlayer';

const baseProps = {
  title: 'Fireman Spin',
  youtubeUrl: 'https://www.youtube.com/watch?v=abc123',
  imageUrl: null,
  stepsData: [] as StepItem[],
  difficulty: 'BEGINNER' as const,
  description: 'A graceful spinning move.',
  tags: [] as { id: string; name: string; color: string | null }[],
  poleTypes: [] as import('@prisma/client').PoleType[],
  moveId: 'move-1',
  isFavourited: false,
  isAuthenticated: true,
  currentProgress: null,
  gripType: null,
  entry: null,
  duration: null,
  coachNote: null,
  coachNoteAuthor: null,
};

describe('MovePlayer', () => {
  beforeEach(() => scrollToMock.mockClear());

  it('renders MoveHero', () => {
    render(<MovePlayer {...baseProps} />);
    expect(screen.getByTestId('move-hero')).toBeInTheDocument();
  });

  it('renders MoveTabs', () => {
    render(<MovePlayer {...baseProps} />);
    expect(screen.getByRole('button', { name: 'seek' })).toBeInTheDocument();
  });

  it('renders the move title as h1', () => {
    render(<MovePlayer {...baseProps} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Fireman Spin' })).toBeInTheDocument();
  });

  it('renders the difficulty chip', () => {
    render(<MovePlayer {...baseProps} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<MovePlayer {...baseProps} />);
    expect(screen.getByText('A graceful spinning move.')).toBeInTheDocument();
  });

  it('renders tags when provided', () => {
    const tags = [
      { id: '1', name: 'Beginner Friendly', color: null },
      { id: '2', name: 'Core', color: null },
    ];
    render(<MovePlayer {...baseProps} tags={tags} />);
    expect(screen.getByText('Beginner Friendly')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
  });

  it('renders no tags section when tags is empty', () => {
    render(<MovePlayer {...baseProps} tags={[]} />);
    expect(screen.queryByText('Spins')).not.toBeInTheDocument();
  });

  it('renders MoveProgressPicker when authenticated', () => {
    render(<MovePlayer {...baseProps} isAuthenticated={true} />);
    expect(screen.getByTestId('progress-picker')).toBeInTheDocument();
  });

  it('does not render MoveProgressPicker when unauthenticated', () => {
    render(<MovePlayer {...baseProps} isAuthenticated={false} />);
    expect(screen.queryByTestId('progress-picker')).not.toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(<MovePlayer {...baseProps} description={null} />);
    expect(screen.queryByText('A graceful spinning move.')).not.toBeInTheDocument();
  });

  it('seeks immediately when already at top (scrollY === 0)', async () => {
    const user = userEvent.setup();
    render(<MovePlayer {...baseProps} />);
    await user.click(screen.getByRole('button', { name: 'seek' }));
    expect(scrollToMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('move-hero')).toHaveAttribute('data-seek-to', '45');
  });

  it('scrolls to top and seeks after delay when not at top', () => {
    vi.useFakeTimers();
    vi.stubGlobal('scrollY', 200);
    render(<MovePlayer {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'seek' }));
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.getByTestId('move-hero')).toHaveAttribute('data-seek-to', '');
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId('move-hero')).toHaveAttribute('data-seek-to', '45');
    vi.stubGlobal('scrollY', 0);
    vi.useRealTimers();
  });
});
