import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getMovesAction } from '../actions';
import type { LocalizedMoveWithTags } from '../types';

import MoveGrid from './MoveGrid';

vi.mock('../actions', () => ({ getMovesAction: vi.fn() }));

vi.mock('./MoveCard', () => ({
  default: ({ move }: { move: LocalizedMoveWithTags }) => <div data-testid="move-card">{move.title}</div>,
}));

const mockGetMovesAction = getMovesAction as ReturnType<typeof vi.fn>;

function makeMoves(count: number, offset = 0): LocalizedMoveWithTags[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `move-${offset + i}`,
    title: `Move ${offset + i}`,
    description: null,
    difficulty: 'BEGINNER' as const,
    category: 'SPINS' as const,
    poleTypes: [],
    youtubeUrl: '',
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
  }));
}

const initialMoves = makeMoves(12);

const observeMock = vi.fn();
const disconnectMock = vi.fn();
let capturedObserverCallback: IntersectionObserverCallback;

beforeEach(() => {
  vi.clearAllMocks();
  observeMock.mockReset();
  disconnectMock.mockReset();
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (this: unknown, cb: IntersectionObserverCallback) {
      capturedObserverCallback = cb;
      return { observe: observeMock, disconnect: disconnectMock };
    }),
  );
});

describe('MoveGrid', () => {
  it('renders editorial header with total count', () => {
    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={242} filters={{}} locale="pl" />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/242 moves/i)).toBeInTheDocument();
  });

  it('renders all initialMoves', () => {
    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );
    expect(screen.getAllByTestId('move-card')).toHaveLength(12);
  });

  it('observes sentinel when hasMore is true', () => {
    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );
    expect(observeMock).toHaveBeenCalled();
  });

  it('does not observe sentinel when initialHasMore is false', () => {
    render(
      <MoveGrid initialMoves={makeMoves(5)} initialHasMore={false} totalCount={5} filters={{}} locale="pl" />,
    );
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('calls getMovesAction with page 2 when sentinel is intersecting', async () => {
    const newMoves = makeMoves(5, 12);
    mockGetMovesAction.mockResolvedValue({ items: newMoves, total: 17, page: 2, pageSize: 12 });

    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );

    await act(async () => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(mockGetMovesAction).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 12 }),
      'pl',
    );
  });

  it('appends new moves to existing list after load more', async () => {
    const newMoves = makeMoves(5, 12);
    mockGetMovesAction.mockResolvedValue({ items: newMoves, total: 17, page: 2, pageSize: 12 });

    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );

    await act(async () => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('move-card')).toHaveLength(17);
    });
  });

  it('passes filters to getMovesAction', async () => {
    const newMoves = makeMoves(3, 12);
    mockGetMovesAction.mockResolvedValue({ items: newMoves, total: 15, page: 2, pageSize: 12 });

    render(
      <MoveGrid
        initialMoves={initialMoves}
        initialHasMore={true}
        totalCount={15}
        filters={{ difficulty: ['BEGINNER'] }}
        locale="pl"
      />,
    );

    await act(async () => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(mockGetMovesAction).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: ['BEGINNER'], page: 2 }),
      'pl',
    );
  });

  it('stops observing when last page is loaded (items < pageSize)', async () => {
    const lastPageMoves = makeMoves(5, 12);
    mockGetMovesAction.mockResolvedValue({
      items: lastPageMoves,
      total: 17,
      page: 2,
      pageSize: 12,
    });

    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );

    await act(async () => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('sentinel')).not.toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', async () => {
    let resolveLoad!: (value: unknown) => void;
    mockGetMovesAction.mockReturnValue(
      new Promise((res) => {
        resolveLoad = res;
      }),
    );

    render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={12} filters={{}} locale="pl" />,
    );

    act(() => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument();

    await act(async () => {
      resolveLoad({ items: [], total: 12, page: 2, pageSize: 12 });
    });
  });

  it('shows empty state text when initialMoves is empty', () => {
    render(<MoveGrid initialMoves={[]} initialHasMore={false} totalCount={0} filters={{}} locale="pl" />);
    expect(screen.getByText('No moves match these filters.')).toBeInTheDocument();
  });

  it('does not render move cards when initialMoves is empty', () => {
    render(<MoveGrid initialMoves={[]} initialHasMore={false} totalCount={0} filters={{}} locale="pl" />);
    expect(screen.queryAllByTestId('move-card')).toHaveLength(0);
  });

  it('does not setState after unmount during fetch', async () => {
    let resolveLoad!: (value: unknown) => void;
    mockGetMovesAction.mockReturnValue(
      new Promise((res) => {
        resolveLoad = res;
      }),
    );

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <MoveGrid initialMoves={initialMoves} initialHasMore={true} totalCount={0} filters={{}} locale="pl" />,
    );

    act(() => {
      capturedObserverCallback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    unmount();

    await act(async () => {
      resolveLoad({
        items: [
          {
            id: 'm12',
            title: 'Late',
            description: null,
            difficulty: 'BEGINNER',
            category: 'SPINS',
            poleTypes: [],
            youtubeUrl: '',
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
          },
        ],
        total: 13,
        page: 2,
        pageSize: 12,
      });
    });

    const stateUpdateWarning = consoleError.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('unmounted component'),
    );
    expect(stateUpdateWarning).toBeUndefined();

    consoleError.mockRestore();
  });
});
