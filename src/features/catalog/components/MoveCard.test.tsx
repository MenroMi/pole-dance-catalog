import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { LocalizedMoveWithTags } from '../types';

import MoveCard from './MoveCard';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

const baseMove: LocalizedMoveWithTags = {
  id: 'move-1',
  title: 'Jade Split',
  description: 'A beautiful aerial move requiring flexibility.',
  difficulty: 'BEGINNER',
  category: 'SPINS',
  poleTypes: [],
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  stepsData: null,
  gripType: null,
  entry: null,
  duration: null,
  coachNote: null,
  coachNoteAuthor: null,
};

describe('MoveCard', () => {
  it('renders title', () => {
    render(<MoveCard move={baseMove} />);
    expect(screen.getByText('Jade Split')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<MoveCard move={baseMove} />);
    expect(screen.getByText('A beautiful aerial move requiring flexibility.')).toBeInTheDocument();
  });

  it('renders difficulty badge', () => {
    render(<MoveCard move={baseMove} />);
    expect(screen.getByText('BEGINNER')).toBeInTheDocument();
  });

  it('falls back to YouTube thumbnail when imageUrl is null', () => {
    render(<MoveCard move={baseMove} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('uses imageUrl when provided', () => {
    const move = {
      ...baseMove,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    };
    render(<MoveCard move={move} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
  });

  it('renders up to 3 tags and hides the rest', () => {
    const move = {
      ...baseMove,
      tags: [
        { id: '1', name: 'flexibility', color: null },
        { id: '2', name: 'strength', color: null },
        { id: '3', name: 'core', color: null },
        { id: '4', name: 'hidden-tag', color: null },
      ] as LocalizedMoveWithTags['tags'],
    };
    render(<MoveCard move={move} />);
    expect(screen.getByText('flexibility')).toBeInTheDocument();
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('core')).toBeInTheDocument();
    expect(screen.queryByText('hidden-tag')).not.toBeInTheDocument();
  });

  it('renders tag with tinted bg and colored text when color is set', () => {
    const move = {
      ...baseMove,
      tags: [{ id: '1', name: 'aerial', color: '#3b82f6' }] as LocalizedMoveWithTags['tags'],
    };
    render(<MoveCard move={move} />);
    const tag = screen.getByText('aerial');
    expect(tag).toHaveStyle({ backgroundColor: '#3b82f628', color: '#3b82f6' });
  });

  it('renders tag without inline style when color is null', () => {
    const move = {
      ...baseMove,
      tags: [{ id: '1', name: 'aerial', color: null }] as LocalizedMoveWithTags['tags'],
    };
    render(<MoveCard move={move} />);
    const tag = screen.getByText('aerial');
    expect(tag).not.toHaveAttribute('style');
  });

  it('card wraps content in a link to /moves/{id}', () => {
    render(<MoveCard move={baseMove} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/moves/move-1');
  });

  it('renders INTERMEDIATE badge with primary-container styling', () => {
    const move = { ...baseMove, difficulty: 'INTERMEDIATE' as const };
    render(<MoveCard move={move} />);
    const badge = screen.getByText('INTERMEDIATE');
    expect(badge.className).toContain('bg-primary-container');
    expect(badge.className).toContain('text-on-surface');
  });

  it('renders placeholder icon when imageUrl is null and youtubeUrl has no valid id', () => {
    const move = { ...baseMove, imageUrl: null, youtubeUrl: '' };
    const { container } = render(<MoveCard move={move} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // lucide icons render as svg
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
