import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProgressWithMove } from '../types';
import ProgressTracker from './ProgressTracker';

vi.mock('../actions', () => ({
  updateProgressAction: vi.fn().mockResolvedValue({ success: true }),
  removeProgressAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: React.ReactNode;
  }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

function makeMove(id: string, title: string, difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') {
  return {
    id,
    title,
    difficulty,
    imageUrl: null,
    youtubeUrl: 'https://youtube.com/watch?v=abc',
    description: null,
    category: 'SPINS' as const,
    poleTypes: [],
    stepsData: [],
    gripType: null,
    entry: null,
    duration: null,
    coachNote: null,
    coachNoteAuthor: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const mockProgress: ProgressWithMove[] = [
  {
    id: 'p1',
    userId: 'u1',
    moveId: 'm1',
    status: 'IN_PROGRESS',
    move: makeMove('m1', 'Fireman Spin', 'BEGINNER'),
  },
  {
    id: 'p2',
    userId: 'u1',
    moveId: 'm2',
    status: 'WANT_TO_LEARN',
    move: makeMove('m2', 'Butterfly', 'INTERMEDIATE'),
  },
  {
    id: 'p3',
    userId: 'u1',
    moveId: 'm3',
    status: 'LEARNED',
    move: makeMove('m3', 'Crucifix', 'BEGINNER'),
  },
];

beforeEach(() => vi.clearAllMocks());

describe('ProgressTracker', () => {
  it('shows "In Progress" tab active by default and renders its moves', () => {
    render(<ProgressTracker initialProgress={mockProgress} userName="Mira" />);
    expect(screen.getByText('Fireman Spin')).toBeInTheDocument();
    expect(screen.queryByText('Butterfly')).not.toBeInTheDocument();
    expect(screen.queryByText('Crucifix')).not.toBeInTheDocument();
  });

  it('displays correct counts on tab buttons', () => {
    render(<ProgressTracker initialProgress={mockProgress} userName={null} />);
    expect(screen.getByRole('tab', { name: /IN_PROGRESS/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /WANT_TO_LEARN/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /LEARNED/ })).toHaveTextContent('1');
  });

  it('shows Want to Learn moves after clicking that tab', async () => {
    const user = userEvent.setup();
    render(<ProgressTracker initialProgress={mockProgress} userName={null} />);
    await user.click(screen.getByRole('tab', { name: /WANT_TO_LEARN/ }));
    expect(screen.getByText('Butterfly')).toBeInTheDocument();
    expect(screen.queryByText('Fireman Spin')).not.toBeInTheDocument();
  });

  it('shows Learned moves after clicking that tab', async () => {
    const user = userEvent.setup();
    render(<ProgressTracker initialProgress={mockProgress} userName={null} />);
    await user.click(screen.getByRole('tab', { name: /LEARNED/ }));
    expect(screen.getByText(/crucifix/i)).toBeInTheDocument();
    expect(screen.queryByText(/fireman spin/i)).not.toBeInTheDocument();
  });

  it('filters moves by search query within the active tab', async () => {
    const user = userEvent.setup();
    const progress: ProgressWithMove[] = [
      {
        id: 'p1',
        userId: 'u1',
        moveId: 'm1',
        status: 'IN_PROGRESS',
        move: makeMove('m1', 'Fireman Spin', 'BEGINNER'),
      },
      {
        id: 'p4',
        userId: 'u1',
        moveId: 'm4',
        status: 'IN_PROGRESS',
        move: makeMove('m4', 'Pole Sit', 'BEGINNER'),
      },
    ];
    render(<ProgressTracker initialProgress={progress} userName={null} />);
    await user.type(screen.getByPlaceholderText('searchMovesPlaceholder'), 'fire');
    expect(screen.getByText('Fireman Spin')).toBeInTheDocument();
    expect(screen.queryByText('Pole Sit')).not.toBeInTheDocument();
  });

  it('shows empty state when In Progress tab has no moves', () => {
    const progress: ProgressWithMove[] = [
      {
        id: 'p2',
        userId: 'u1',
        moveId: 'm2',
        status: 'WANT_TO_LEARN',
        move: makeMove('m2', 'Butterfly', 'INTERMEDIATE'),
      },
    ];
    render(<ProgressTracker initialProgress={progress} userName={null} />);
    expect(screen.getByText('emptyInProgress')).toBeInTheDocument();
  });

  it('shows no-match message when search has no results', async () => {
    const user = userEvent.setup();
    render(<ProgressTracker initialProgress={mockProgress} userName={null} />);
    await user.type(screen.getByPlaceholderText('searchMovesPlaceholder'), 'xyznotamove');
    expect(screen.getByText('noSearchMatch')).toBeInTheDocument();
  });

  it('shows total tracked count in header', () => {
    render(<ProgressTracker initialProgress={mockProgress} userName="Mira" />);
    expect(screen.getByText(/3 tracked/i)).toBeInTheDocument();
  });

  it('tab remains clickable after status change (regression: exiting layer blocking clicks)', async () => {
    const user = userEvent.setup();
    render(<ProgressTracker initialProgress={mockProgress} userName={null} />);
    const wantToLearnTab = screen.getByRole('tab', { name: /WANT_TO_LEARN/ });
    await user.click(screen.getByRole('tab', { name: /IN_PROGRESS/ }));
    await user.click(wantToLearnTab);
    expect(screen.getByText('Butterfly')).toBeInTheDocument();
  });
});
