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

import { MoveModal } from './MoveModal';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const DIFF_STYLES: Record<string, { bg: string; fg: string }> = {
  BEGINNER: { bg: 'rgba(132,209,153,0.16)', fg: '#84d099' },
  INTERMEDIATE: { bg: 'rgba(132,88,179,0.20)', fg: '#c5afe2' },
  ADVANCED: { bg: 'rgba(251,191,36,0.14)', fg: '#fbbf24' },
};

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
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
    X: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    Check: <polyline points="20 6 9 17 4 12" />,
  };
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
      {paths[name]}
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

const GRID = '2fr 1fr 1fr 1fr 96px';

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
  const [hov, setHov] = useState(false);
  const dc = DIFF_STYLES[move.difficulty] ?? DIFF_STYLES.BEGINNER;

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
        <Chip label={move.difficulty} bg={dc.bg} fg={dc.fg} />
      </div>

      {/* Category */}
      <div style={{ fontSize: 13, color: '#978e9b', fontFamily: 'var(--font-manrope)' }}>
        {move.category}
      </div>

      {/* Tags (kept from existing functionality) */}
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

interface DeleteConfirmProps {
  move: AdminMoveRow;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ move, loading, error, onConfirm, onCancel }: DeleteConfirmProps) {
  const t = useTranslations('admin');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1b1b1b',
          border: '1px solid rgba(75,68,80,0.4)',
          borderRadius: 16,
          padding: 36,
          width: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'fadeUp 200ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(179,38,30,0.15)',
            border: '1px solid rgba(179,38,30,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: 20,
          }}
        >
          <NavIcon name="Trash" size={22} />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 22,
            fontWeight: 600,
            color: '#e2e2e2',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          {t('moves.deleteTitle')}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 14,
            color: '#978e9b',
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#e2e2e2' }}>{move.title_en}</strong> {t('moves.deleteBody')}
        </p>
        {error && (
          <p
            style={{
              fontSize: 14,
              color: '#ef4444',
              fontFamily: 'var(--font-manrope)',
              margin: '0 0 16px',
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid rgba(75,68,80,0.4)',
              borderRadius: 8,
              padding: '9px 20px',
              color: '#cdc3d2',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#978e9b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: '#b3261e',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              color: '#fff',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#d32f2f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#b3261e';
            }}
          >
            {loading ? '…' : t('moves.deleteMove')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminMoves() {
  const t = useTranslations('admin');
  const [moves, setMoves] = useState<AdminMoveRow[]>([]);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMove, setEditMove] = useState<FullAdminMove | null>(null);
  const [availableTags, setAvailableTags] = useState<AdminTagRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminMoveRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!hasFetchedRef.current) setLoading(true);
    else setIsFetching(true);
    getMovesForAdminAction()
      .then((data) => {
        if (!cancelled) {
          hasFetchedRef.current = true;
          setMoves(data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setIsFetching(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
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
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function handleModalSaved() {
    setModalOpen(false);
    refresh();
  }

  const filtered = moves.filter((m) => {
    const matchSearch =
      !search ||
      m.title_en.toLowerCase().includes(search.toLowerCase()) ||
      m.title_pl.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === 'ALL' || m.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <div style={{ padding: '32px 40px 80px' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 28,
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
            {t('moves.catalog')} · {filtered.length} {t('moves.movesCount')}
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {(['ALL', ...DIFFICULTIES] as const).map((d) => {
            const active = diffFilter === d;
            const ds = d !== 'ALL' ? DIFF_STYLES[d] : null;
            return (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
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
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#1b1b1b',
          border: '1px solid rgba(75,68,80,0.2)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '10px 20px',
            borderBottom: '1px solid rgba(75,68,80,0.2)',
          }}
        >
          {[
            t('moves.cols.title'),
            t('moves.cols.difficulty'),
            t('moves.cols.category'),
            t('moves.cols.tags'),
            '',
          ].map((h, i) => (
            <span
              key={i}
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

        {!loading && filtered.length === 0 && (
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

        {!loading && filtered.length > 0 && (
          <div style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.15s' }}>
            {filtered.map((move, i) => (
              <MoveRow
                key={move.id}
                move={move}
                isLast={i === filtered.length - 1}
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
        <DeleteConfirm
          move={deleteTarget}
          loading={deleting}
          error={deleteError}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
