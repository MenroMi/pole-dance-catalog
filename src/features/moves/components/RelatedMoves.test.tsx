import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

import RelatedMoves from './RelatedMoves';

type RelatedMove = Parameters<typeof RelatedMoves>[0]['moves'][0];

const makeMove = (overrides: Partial<RelatedMove> = {}): RelatedMove => ({
  id: 'move-1',
  title: 'Fireman Spin',
  difficulty: 'BEGINNER',
  imageUrl: null,
  youtubeUrl: 'https://youtube.com/watch?v=abc1234abcd',
  ...overrides,
});

describe('RelatedMoves', () => {
  it('renders nothing when moves array is empty', async () => {
    const result = await RelatedMoves({ moves: [] });
    expect(result).toBeNull();
  });

  it('renders a link to each move', async () => {
    render(await RelatedMoves({ moves: [makeMove()] }));
    expect(screen.getByRole('link', { name: /fireman spin/i })).toHaveAttribute(
      'href',
      '/moves/move-1',
    );
  });

  it('renders difficulty as translated key', async () => {
    render(await RelatedMoves({ moves: [makeMove({ difficulty: 'INTERMEDIATE' })] }));
    expect(screen.getByText('difficulty.INTERMEDIATE')).toBeInTheDocument();
  });

  it('renders up to 4 moves', async () => {
    const moves = Array.from({ length: 4 }, (_, i) =>
      makeMove({ id: `m-${i}`, title: `Move ${i}` }),
    );
    render(await RelatedMoves({ moves }));
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('renders a thumbnail img when youtubeUrl is provided', async () => {
    const { container } = render(
      await RelatedMoves({
        moves: [makeMove({ youtubeUrl: 'https://youtube.com/watch?v=abc1234abcd' })],
      }),
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('abc1234abcd'));
  });

  it('renders a thumbnail img when imageUrl is provided', async () => {
    const { container } = render(
      await RelatedMoves({ moves: [makeMove({ imageUrl: 'https://example.com/thumb.jpg' })] }),
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('renders no img when no thumbnail is available', async () => {
    const { container } = render(
      await RelatedMoves({
        moves: [makeMove({ imageUrl: null, youtubeUrl: 'https://example.com/not-youtube' })],
      }),
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
