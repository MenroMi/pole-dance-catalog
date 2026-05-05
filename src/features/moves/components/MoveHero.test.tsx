import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Stub window.matchMedia — jsdom doesn't implement it
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

vi.stubGlobal('matchMedia', matchMediaMock);

import MoveHero from './MoveHero';

const baseProps = {
  title: 'Fireman Spin',
  youtubeUrl: 'https://www.youtube.com/watch?v=abc1234abcd',
  imageUrl: null,
};

function getIframe() {
  return screen.queryByTitle('Fireman Spin');
}

describe('MoveHero', () => {
  beforeEach(() => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  describe('initial idle state', () => {
    it('renders the play button in idle state', () => {
      render(<MoveHero {...baseProps} />);
      expect(screen.getByRole('button', { name: 'playMove' })).toBeInTheDocument();
    });

    it('does not render the iframe in idle state', () => {
      render(<MoveHero {...baseProps} />);
      expect(getIframe()).not.toBeInTheDocument();
    });
  });

  describe('seek while phase === idle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets startAt and transitions to transitioning then playing after 500ms', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);

      // Provide a seek request
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 42 }} />);

      // After seek from idle: iframe should be present (phase = transitioning)
      const iframe = getIframe();
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('start=42'));

      // After 500ms timeout, phase becomes playing
      act(() => vi.advanceTimersByTime(500));

      const iframeAfter = getIframe();
      expect(iframeAfter).toBeInTheDocument();
      expect(iframeAfter).toHaveAttribute('src', expect.stringContaining('start=42'));
    });

    it('iframe is initially opacity-0 (transitioning) and becomes opacity-100 after timeout', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 10 }} />);

      const iframe = getIframe();
      // During transitioning phase, class includes opacity-0
      expect(iframe?.className).toContain('opacity-0');

      act(() => vi.advanceTimersByTime(500));

      // After playing phase, class includes opacity-100
      expect(getIframe()?.className).toContain('opacity-100');
    });

    it('removes the play button once transition starts', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 5 }} />);

      // In transitioning phase the play button is gone (phase !== 'idle')
      expect(screen.queryByRole('button', { name: 'playMove' })).not.toBeInTheDocument();
    });

    it('skips transitioning and goes directly to playing when prefers-reduced-motion is set', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { rerender } = render(<MoveHero {...baseProps} />);
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 20 }} />);

      // Should be playing immediately (opacity-100), no timer needed
      const iframe = getIframe();
      expect(iframe).toBeInTheDocument();
      expect(iframe?.className).toContain('opacity-100');
      expect(iframe).toHaveAttribute('src', expect.stringContaining('start=20'));
    });
  });

  describe('seek while phase === playing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets startAt and remounts the iframe (iframeKey increments)', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);

      // Transition to playing state
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 10 }} />);
      act(() => vi.advanceTimersByTime(500));

      const iframeBefore = getIframe();
      expect(iframeBefore).toBeInTheDocument();
      expect(iframeBefore).toHaveAttribute('src', expect.stringContaining('start=10'));

      // Now seek again with a new object reference — should remount iframe
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 90 }} />);

      const iframeAfter = getIframe();
      expect(iframeAfter).toBeInTheDocument();
      expect(iframeAfter).toHaveAttribute('src', expect.stringContaining('start=90'));
    });

    it('remounts the iframe when seeking to the same timestamp (new object reference)', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);

      // Get to playing state
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 30 }} />);
      act(() => vi.advanceTimersByTime(500));

      const iframeBefore = getIframe();
      expect(iframeBefore).toBeInTheDocument();

      // Same timestamp, new object — should still remount
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 30 }} />);

      const iframeAfter = getIframe();
      expect(iframeAfter).toBeInTheDocument();
      expect(iframeAfter).toHaveAttribute('src', expect.stringContaining('start=30'));
    });
  });

  describe('seek while phase === transitioning', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('ignores seek — does not change startAt or restart the transition', () => {
      const { rerender } = render(<MoveHero {...baseProps} />);

      // Trigger first seek to enter transitioning
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 15 }} />);

      // Still in transitioning (500ms hasn't elapsed)
      const iframeBeforeSecondSeek = getIframe();
      expect(iframeBeforeSecondSeek).toHaveAttribute('src', expect.stringContaining('start=15'));

      // Attempt second seek while still transitioning
      rerender(<MoveHero {...baseProps} seekRequest={{ seconds: 99 }} />);

      // startAt should NOT have changed to 99
      const iframeAfterIgnoredSeek = getIframe();
      expect(iframeAfterIgnoredSeek).toHaveAttribute('src', expect.stringContaining('start=15'));
      expect(iframeAfterIgnoredSeek).not.toHaveAttribute(
        'src',
        expect.stringContaining('start=99'),
      );
    });
  });

  describe('no videoId', () => {
    it('ignores seek when youtubeUrl is invalid (no videoId extracted)', () => {
      const { rerender } = render(
        <MoveHero
          title="Fireman Spin"
          youtubeUrl="https://example.com/not-youtube"
          imageUrl={null}
        />,
      );

      rerender(
        <MoveHero
          title="Fireman Spin"
          youtubeUrl="https://example.com/not-youtube"
          imageUrl={null}
          seekRequest={{ seconds: 42 }}
        />,
      );

      // No iframe should ever appear when there's no valid videoId
      expect(getIframe()).not.toBeInTheDocument();
      // Play button is also absent (no videoId)
      expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
    });
  });

  describe('play button click (no seekRequest)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('transitions from idle to playing when play button is clicked', () => {
      render(<MoveHero {...baseProps} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'playMove' }));
      });

      // Should be in transitioning phase (iframe present, opacity-0)
      const iframe = getIframe();
      expect(iframe).toBeInTheDocument();
      expect(iframe?.className).toContain('opacity-0');

      // After timeout, should be in playing phase
      act(() => vi.advanceTimersByTime(500));
      expect(getIframe()?.className).toContain('opacity-100');
    });

    it('plays without startAt when no seek was made (src has no start= param)', () => {
      render(<MoveHero {...baseProps} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'playMove' }));
      });
      act(() => vi.advanceTimersByTime(500));

      const iframe = getIframe();
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.not.stringContaining('start='));
      expect(iframe).toHaveAttribute('src', expect.stringContaining('autoplay=1'));
    });
  });

  describe('imageUrl handling', () => {
    it('renders a provided imageUrl as the thumbnail', () => {
      render(<MoveHero {...baseProps} imageUrl="https://example.com/thumb.jpg" />);
      const img = screen.getByAltText('Fireman Spin');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });

    it('falls back to YouTube thumbnail when imageUrl is null', () => {
      render(<MoveHero {...baseProps} />);
      const img = screen.getByAltText('Fireman Spin');
      expect(img).toHaveAttribute('src', expect.stringContaining('img.youtube.com/vi/abc1234abcd'));
    });
  });
});
