import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: vi.fn(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  redirect: vi.fn(),
}));

import RelatedMoves from './RelatedMoves';

const makeMove = (overrides: Partial<Parameters<typeof RelatedMoves>[0]['moves'][0]> = {}) => ({
  id: 'move-1',
  title: 'Fireman Spin',
  difficulty: 'BEGINNER',
  imageUrl: null,
  youtubeUrl: 'https://youtube.com/watch?v=abc1234abcd',
  ...overrides,
});

describe('RelatedMoves', () => {
  it('renders nothing when moves array is empty', () => {
    const { container } = render(<RelatedMoves moves={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link to each move', () => {
    render(<RelatedMoves moves={[makeMove()]} />);
    expect(screen.getByRole('link', { name: /fireman spin/i })).toHaveAttribute(
      'href',
      '/moves/move-1',
    );
  });

  it('renders difficulty in uppercase', () => {
    render(<RelatedMoves moves={[makeMove({ difficulty: 'INTERMEDIATE' })]} />);
    expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
  });

  it('renders up to 4 moves', () => {
    const moves = Array.from({ length: 4 }, (_, i) =>
      makeMove({ id: `m-${i}`, title: `Move ${i}` }),
    );
    render(<RelatedMoves moves={moves} />);
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('renders a thumbnail img when youtubeUrl is provided', () => {
    const { container } = render(
      <RelatedMoves
        moves={[makeMove({ youtubeUrl: 'https://youtube.com/watch?v=abc1234abcd' })]}
      />,
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('abc1234abcd'));
  });

  it('renders a thumbnail img when imageUrl is provided', () => {
    const { container } = render(
      <RelatedMoves moves={[makeMove({ imageUrl: 'https://example.com/thumb.jpg' })]} />,
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('renders no img when no thumbnail is available', () => {
    const { container } = render(
      <RelatedMoves
        moves={[makeMove({ imageUrl: null, youtubeUrl: 'https://example.com/not-youtube' })]}
      />,
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
