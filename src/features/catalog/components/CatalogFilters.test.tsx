import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useRouter } from '@/i18n/navigation';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import CatalogFilters from './CatalogFilters';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
  usePathname: () => '/catalog',
  useRouter: vi.fn(),
  redirect: vi.fn(),
}));

const mockTags = [
  { id: 'tag-1', name: 'aerial', color: '#3b82f6' },
  { id: 'tag-2', name: 'flexibility', color: '#a855f7' },
];

describe('CatalogFilters', () => {
  let mockReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // --- Pole state ---

  it('renders Static and Spin buttons', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    expect(screen.getByRole('button', { name: 'Static' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Spin' })).toBeInTheDocument();
  });

  it('clicking Static adds poleType=STATIC to URL', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Static' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?poleType=STATIC');
  });

  it('clicking Static then Spin adds both to URL (multi-select)', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?poleType=STATIC,SPIN');
  });

  it('clicking active Static removes it from URL', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Static' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });

  it('active pole type button has text-primary class', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    expect(screen.getByRole('button', { name: 'Static' }).className).toContain('text-primary');
  });

  it('inactive pole type button does not have text-primary class', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    expect(screen.getByRole('button', { name: 'Spin' }).className).not.toContain('text-primary');
  });

  // --- Difficulty ---

  it('renders Beginner, Intermediate, Advanced buttons', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    expect(screen.getByRole('button', { name: 'Beginner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Intermediate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument();
  });

  it('clicking Beginner adds difficulty=BEGINNER to URL', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?difficulty=BEGINNER');
  });

  it('clicking Beginner then Intermediate adds both (multi-select)', () => {
    render(<CatalogFilters filters={{ difficulty: ['BEGINNER'] }} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Intermediate' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?difficulty=BEGINNER,INTERMEDIATE');
  });

  it('clicking active Beginner removes it from URL', () => {
    render(<CatalogFilters filters={{ difficulty: ['BEGINNER'] }} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });

  it('active difficulty button has text-primary class', () => {
    render(<CatalogFilters filters={{ difficulty: ['BEGINNER'] }} availableTags={[]} />);
    expect(screen.getByRole('button', { name: 'Beginner' }).className).toContain('text-primary');
  });

  // --- Tags ---

  it('renders tag buttons by name', () => {
    render(<CatalogFilters filters={{}} availableTags={mockTags} />);
    expect(screen.getByRole('button', { name: 'aerial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'flexibility' })).toBeInTheDocument();
  });

  it('does not render tags section when availableTags is empty', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    expect(screen.queryByRole('button', { name: 'aerial' })).not.toBeInTheDocument();
  });

  it('clicking a tag adds its name to URL', () => {
    render(<CatalogFilters filters={{}} availableTags={mockTags} />);
    fireEvent.click(screen.getByRole('button', { name: 'aerial' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?tags=aerial');
  });

  it('clicking two tags adds both names (multi-select)', () => {
    render(<CatalogFilters filters={{ tags: ['aerial'] }} availableTags={mockTags} />);
    fireEvent.click(screen.getByRole('button', { name: 'flexibility' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?tags=aerial,flexibility');
  });

  it('clicking active tag removes it from URL', () => {
    render(<CatalogFilters filters={{ tags: ['aerial'] }} availableTags={mockTags} />);
    fireEvent.click(screen.getByRole('button', { name: 'aerial' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });

  it('active tag button has aria-pressed true and color style', () => {
    render(<CatalogFilters filters={{ tags: ['aerial'] }} availableTags={mockTags} />);
    const btn = screen.getByRole('button', { name: 'aerial' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveStyle({ backgroundColor: '#3b82f628', color: '#3b82f6' });
  });

  // --- Cross-filter: filters preserved across groups ---

  it('clicking difficulty preserves active poleType in URL', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?poleType=STATIC&difficulty=BEGINNER');
  });

  it('clicking tag preserves active difficulty in URL', () => {
    render(<CatalogFilters filters={{ difficulty: ['BEGINNER'] }} availableTags={mockTags} />);
    fireEvent.click(screen.getByRole('button', { name: 'aerial' }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?difficulty=BEGINNER&tags=aerial');
  });

  // --- Clear filters ---

  it('Clear filters button is visible when any filter is active', () => {
    render(<CatalogFilters filters={{ poleTypes: ['STATIC'] }} availableTags={[]} />);
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('Clear filters button is hidden when no filters are active', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it('Clear filters resets all filters and navigates to /catalog', () => {
    render(
      <CatalogFilters
        filters={{ poleTypes: ['STATIC'], difficulty: ['BEGINNER'], tags: ['aerial'] }}
        availableTags={mockTags}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(mockReplace).toHaveBeenCalledWith('/catalog');
  });

  it('Clear filters resets search input value', () => {
    render(<CatalogFilters filters={{ search: 'jade' }} availableTags={[]} />);
    const input = screen.getByRole('textbox', { name: /search/i }) as HTMLInputElement;
    expect(input.value).toBe('jade');
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(input.value).toBe('');
  });

  // --- Search ---

  it('search clear button hidden when search is empty', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('search clear button visible when search has value', () => {
    render(<CatalogFilters filters={{ search: 'jade' }} availableTags={[]} />);
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('search clear button clears input and removes search from URL, keeps other filters', () => {
    render(
      <CatalogFilters filters={{ poleTypes: ['STATIC'], search: 'jade' }} availableTags={[]} />,
    );
    const input = screen.getByRole('textbox', { name: /search/i }) as HTMLInputElement;
    expect(input.value).toBe('jade');
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(input.value).toBe('');
    expect(mockReplace).toHaveBeenCalledWith('/catalog?poleType=STATIC');
  });

  it('search triggers router.replace after 300ms debounce', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'jade' },
    });
    expect(mockReplace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(350));
    expect(mockReplace).toHaveBeenCalledWith('/catalog?search=jade');
  });

  it('search does not trigger router.replace before debounce fires', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'jade' },
    });
    act(() => vi.advanceTimersByTime(100));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('clicking a filter during typing cancels pending debounce', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'jade' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Static' }));
    mockReplace.mockClear();
    act(() => vi.advanceTimersByTime(500));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not trigger router.replace on initial mount', () => {
    render(<CatalogFilters filters={{}} availableTags={[]} />);
    act(() => vi.advanceTimersByTime(500));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
