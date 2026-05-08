'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import {
  deleteMoveAction,
  getMoveByIdAction,
  getMovesForAdminAction,
  getTagsForAdminAction,
} from '../actions';
import type { AdminMoveRow, AdminTagRow, FullAdminMove } from '../types';

import { ConfirmDialog } from './ConfirmDialog';
import { MoveModal } from './MoveModal';

type DifficultyFilter = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const DIFF_STYLES: Record<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED', { bg: string; fg: string }> = {
  BEGINNER: { bg: 'rgba(132,209,153,0.16)', fg: '#84d099' },
  INTERMEDIATE: { bg: 'rgba(132,88,179,0.20)', fg: '#c5afe2' },
  ADVANCED: { bg: 'rgba(251,191,36,0.14)', fg: '#fbbf24' },
};

const NAV_ICON_PATHS = {
  Plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  Search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  Edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  Trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
} as const;

function NavIcon({ name, size = 16 }: { name: keyof typeof NAV_ICON_PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {NAV_ICON_PATHS[name]}
    </svg>
  );
}

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 9999,
        fontFamily: 'var(--font-manrope)',
        background: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {label}
    </span>
  );
}

const GRID = '2fr 1fr 1fr 1fr 80px 80px 96px';

function MoveRow({
  move,
  isLast,
  onEdit,
  onDelete,
}: {
  move: AdminMoveRow;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('admin');
  const tEnums = useTranslations('enums');
  const [hov, setHov] = useState(false);
  const dc =
    DIFF_STYLES[move.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'] ??
    DIFF_STYLES.BEGINNER;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        padding: '13px 20px',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid rgba(75,68,80,0.12)',
        background: hov ? 'rgba(220,184,255,0.04)' : 'transparent',
        transition: 'background 150ms',
      }}
    >
      {/* Move identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#0e0e0e,#2a2a2a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(75,68,80,0.2)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 14,
              color: 'rgba(220,184,255,0.45)',
            }}
          >
            ◇
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 14,
              color: '#e2e2e2',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {move.title_en}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#6b6270',
              fontFamily: 'var(--font-manrope)',
              marginTop: 1,
            }}
          >
            {move.title_pl}
          </div>
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <Chip
          label={tEnums(
            `difficulty.${move.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'}`,
          )}
          bg={dc.bg}
          fg={dc.fg}
        />
      </div>

      {/* Category */}
      <div style={{ fontSize: 13, color: '#978e9b', fontFamily: 'var(--font-manrope)' }}>
        {tEnums(
          `category.${move.category as 'SPINS' | 'CLIMBS' | 'HOLDS' | 'COMBOS' | 'FLOORWORK'}`,
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {move.tags.slice(0, 3).map((tag) => (
          <Chip key={tag.id} label={tag.name_en} bg="rgba(75,68,80,0.2)" fg="#cdc3d2" />
        ))}
        {move.tags.length > 3 && (
          <span style={{ fontSize: 12, color: '#6b6270', fontFamily: 'var(--font-manrope)' }}>
            +{move.tags.length - 3}
          </span>
        )}
      </div>

      {/* Favourites */}
      <div style={{ fontSize: 12, color: '#978e9b', fontFamily: 'var(--font-manrope)' }}>
        {move._count.favourites || '—'}
      </div>

      {/* Progress */}
      <div style={{ fontSize: 12, color: '#978e9b', fontFamily: 'var(--font-manrope)' }}>
        {move._count.progress || '—'}
      </div>

      {/* Actions — hover reveal */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          opacity: hov ? 1 : 0.25,
          transition: 'opacity 150ms',
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          title={t('edit')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: 'pointer',
            display: 'flex',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#dcb8ff';
            e.currentTarget.style.color = '#dcb8ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            e.currentTarget.style.color = '#978e9b';
          }}
        >
          <NavIcon name="Edit" size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={t('delete')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: 'pointer',
            display: 'flex',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            e.currentTarget.style.color = '#978e9b';
          }}
        >
          <NavIcon name="Trash" size={13} />
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

// Survives re-mounts (locale changes) within the same session without triggering a full spinner.
type CachedMoves = { moves: AdminMoveRow[]; total: number };
let _movesCache: CachedMoves | null = null;
let _movesCacheKey = '';
const DEFAULT_MOVES_CACHE_KEY = '1::ALL';

export function AdminMoves() {
  const t = useTranslations('admin');
  const tEnums = useTranslations('enums');
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const cacheHit = _movesCache !== null && _movesCacheKey === DEFAULT_MOVES_CACHE_KEY;
  const hasFetchedRef = useRef(cacheHit);
  const [moves, setMoves] = useState<AdminMoveRow[]>(cacheHit ? _movesCache!.moves : []);
  const [loading, setLoading] = useState(!cacheHit);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(cacheHit ? _movesCache!.total : 0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMove, setEditMove] = useState<FullAdminMove | null>(null);
  const [availableTags, setAvailableTags] = useState<AdminTagRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminMoveRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(
      () => {
        if (!hasFetchedRef.current) setLoading(true);
        else setIsFetching(true);
        getMovesForAdminAction({ page, pageSize: PAGE_SIZE, query, difficulty: diffFilter })
          .then((data) => {
            if (!cancelled) {
              hasFetchedRef.current = true;
              _movesCache = { moves: data.moves, total: data.total };
              _movesCacheKey = `${page}:${query}:${diffFilter}`;
              setMoves(data.moves);
              setTotal(data.total);
              setError(null);
            }
          })
          .catch((e) => {
            if (!cancelled)
              setError(e instanceof Error ? e.message : tRef.current('moves.loadError'));
          })
          .finally(() => {
            if (!cancelled) {
              setLoading(false);
              setIsFetching(false);
            }
          });
      },
      query ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [page, query, diffFilter, refreshKey]);

  function handleQueryChange(val: string) {
    setQuery(val);
    setPage(1);
  }

  function handleDiffFilterChange(d: DifficultyFilter) {
    setDiffFilter(d);
    setPage(1);
  }

  async function handleAddMove() {
    const tags = await getTagsForAdminAction().catch(() => []);
    setAvailableTags(tags);
    setEditMove(null);
    setModalOpen(true);
  }

  async function handleEditMove(id: string) {
    const [move, tags] = await Promise.all([
      getMoveByIdAction(id).catch(() => null),
      getTagsForAdminAction().catch(() => []),
    ]);
    if (!move) return;
    setAvailableTags(tags);
    setEditMove(move);
    setModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMoveAction(deleteTarget.id);
      setMoves((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setTotal((n) => n - 1);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : tRef.current('moves.loadError'));
    } finally {
      setDeleting(false);
    }
  }

  function handleModalSaved() {
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div
      style={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Page header */}
      <div style={{ padding: '32px 40px 0', flexShrink: 0, marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#6b6270',
                fontFamily: 'var(--font-manrope)',
                marginBottom: 8,
              }}
            >
              {t('moves.catalog')} · {total} {t('moves.movesCount')}
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: '#e2e2e2',
                margin: 0,
              }}
            >
              {t('moves.title').toLowerCase()}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleAddMove}
            style={{
              background: 'linear-gradient(135deg,#dcb8ff,#8458b3,#dcb8ff)',
              backgroundSize: '200% 200%',
              backgroundPosition: 'left center',
              border: 'none',
              borderRadius: 8,
              padding: '11px 22px',
              color: '#f8ebff',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px -2px rgba(132,88,179,0.4)',
              transition: 'background-position 400ms, box-shadow 300ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundPosition = 'right center';
              e.currentTarget.style.boxShadow = '0 6px 24px -2px rgba(220,184,255,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundPosition = 'left center';
              e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(132,88,179,0.4)';
            }}
          >
            <NavIcon name="Plus" size={14} /> {t('moves.addMove').toLowerCase()}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          padding: '0 40px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#1b1b1b',
            border: '1px solid rgba(75,68,80,0.3)',
            borderRadius: 8,
            padding: '8px 14px',
          }}
        >
          <span style={{ color: '#978e9b', display: 'flex', flexShrink: 0 }}>
            <NavIcon name="Search" size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t('moves.search')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e2e2',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              outline: 'none',
              flex: 1,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', ...DIFFICULTIES] as DifficultyFilter[]).map((d) => {
            const active = diffFilter === d;
            const ds = d !== 'ALL' ? DIFF_STYLES[d] : null;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDiffFilterChange(d)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-manrope)',
                  border: 'none',
                  transition: 'all 150ms',
                  background: active ? (ds ? ds.bg : 'rgba(220,184,255,0.15)') : 'transparent',
                  color: active ? (ds ? ds.fg : '#dcb8ff') : '#978e9b',
                }}
              >
                {d === 'ALL'
                  ? t('moves.allDifficulties')
                  : tEnums(`difficulty.${d as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'}`)}
              </button>
            );
          })}
        </div>
        <span
          style={{
            color: '#6b6270',
            fontSize: 13,
            fontFamily: 'var(--font-manrope)',
            whiteSpace: 'nowrap',
          }}
        >
          {total}
        </span>
      </div>

      {error && (
        <div
          style={{
            margin: '0 40px 12px',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            color: '#f87171',
            fontSize: 14,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(248,113,113,0.4)',
              borderRadius: 6,
              padding: '5px 12px',
              color: '#f87171',
              fontFamily: 'var(--font-manrope)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#1b1b1b',
            borderRadius: 12,
            border: '1px solid rgba(75,68,80,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              padding: '10px 20px',
              borderBottom: '1px solid rgba(75,68,80,0.2)',
              flexShrink: 0,
            }}
          >
            {(
              [
                ['title', t('moves.cols.title')],
                ['difficulty', t('moves.cols.difficulty')],
                ['category', t('moves.cols.category')],
                ['tags', t('moves.cols.tags')],
                ['favourites', t('moves.cols.favourites')],
                ['progress', t('moves.cols.progress')],
                ['actions', ''],
              ] as [string, string][]
            ).map(([id, h]) => (
              <span
                key={id}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#6b6270',
                  fontFamily: 'var(--font-manrope)',
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loading && (
              <div
                style={{
                  padding: '60px 0',
                  textAlign: 'center',
                  color: '#6b6270',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                }}
              >
                {t('loading')}
              </div>
            )}

            {!loading && moves.length === 0 && (
              <div
                style={{
                  padding: '60px 0',
                  textAlign: 'center',
                  color: '#6b6270',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                }}
              >
                {t('moves.noResults')}
              </div>
            )}

            {!loading && moves.length > 0 && (
              <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                {moves.map((move, i) => (
                  <MoveRow
                    key={move.id}
                    move={move}
                    isLast={i === moves.length - 1}
                    onEdit={() => handleEditMove(move.id)}
                    onDelete={() => {
                      setDeleteTarget(move);
                      setDeleteError(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '12px 40px',
          flexShrink: 0,
        }}
      >
        {totalPages > 1 && (
          <>
            <button
              type="button"
              disabled={page <= 1 || loading || isFetching}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '7px 18px',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'var(--font-manrope)',
                fontWeight: 600,
                background: page <= 1 ? 'rgba(75,68,80,0.1)' : 'rgba(220,184,255,0.10)',
                color: page <= 1 ? '#4b4450' : '#dcb8ff',
                border: '1px solid',
                borderColor: page <= 1 ? 'rgba(75,68,80,0.2)' : 'rgba(220,184,255,0.25)',
                cursor: page <= 1 || loading || isFetching ? 'not-allowed' : 'pointer',
                transition: 'all 150ms',
              }}
            >
              ←
            </button>
            <span
              style={{
                fontSize: 13,
                color: '#978e9b',
                fontFamily: 'var(--font-manrope)',
                minWidth: 80,
                textAlign: 'center',
              }}
            >
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading || isFetching}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '7px 18px',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'var(--font-manrope)',
                fontWeight: 600,
                background: page >= totalPages ? 'rgba(75,68,80,0.1)' : 'rgba(220,184,255,0.10)',
                color: page >= totalPages ? '#4b4450' : '#dcb8ff',
                border: '1px solid',
                borderColor: page >= totalPages ? 'rgba(75,68,80,0.2)' : 'rgba(220,184,255,0.25)',
                cursor: page >= totalPages || loading || isFetching ? 'not-allowed' : 'pointer',
                transition: 'all 150ms',
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Edit/Create modal */}
      {modalOpen && (
        <MoveModal
          move={editMove}
          availableTags={availableTags}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title={t('moves.deleteTitle')}
          description={`${deleteTarget.title_en} ${t('moves.deleteBody')}`}
          confirmLabel={t('moves.deleteMove')}
          loadingLabel={t('loading')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          loading={deleting}
          error={deleteError}
          danger={true}
        />
      )}
    </div>
  );
}
