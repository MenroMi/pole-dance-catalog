'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import {
  deleteMoveAction,
  getMoveByIdAction,
  getMovesForAdminAction,
  getTagsForAdminAction,
} from '../actions';
import { DIFFICULTY_COLORS } from '../constants';
import type { AdminMoveRow, AdminTagRow, FullAdminMove } from '../types';

import { ConfirmDialog } from './ConfirmDialog';
import { MoveModal } from './MoveModal';

const DIFFICULTIES = ['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export function AdminMoves() {
  const t = useTranslations('admin');
  const [moves, setMoves] = useState<AdminMoveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMove, setEditMove] = useState<FullAdminMove | null>(null);
  const [availableTags, setAvailableTags] = useState<AdminTagRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMovesForAdminAction()
      .then((data) => {
        if (!cancelled) setMoves(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setLoading(true);
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
      await deleteMoveAction(deleteTarget);
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
    const matchDifficulty = !difficultyFilter || m.difficulty === difficultyFilter;
    return matchSearch && matchDifficulty;
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('moves.search')}
          style={{
            flex: 1,
            minWidth: 200,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e0e0e0',
            borderRadius: 8,
          }}
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e0e0e0',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d} style={{ background: '#1a1a1a' }}>
              {d || t('moves.allDifficulties')}
            </option>
          ))}
        </select>
        <Button
          onClick={handleAddMove}
          style={{ background: '#8458b3', color: '#fff', whiteSpace: 'nowrap' }}
        >
          + {t('moves.addMove')}
        </Button>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 120px 1fr auto',
            gap: 16,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#666',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t('moves.cols.title')}</span>
          <span>{t('moves.cols.difficulty')}</span>
          <span>{t('moves.cols.category')}</span>
          <span>{t('moves.cols.tags')}</span>
          <span>{t('moves.cols.actions')}</span>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
            {t('moves.noResults')}
          </div>
        )}

        {!loading &&
          filtered.map((move, i) => (
            <div
              key={move.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 120px 1fr auto',
                gap: 16,
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 500 }}>
                  {move.title_en}
                </div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{move.title_pl}</div>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.06)',
                  color: DIFFICULTY_COLORS[move.difficulty] ?? '#e0e0e0',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {move.difficulty}
              </span>
              <span style={{ color: '#888', fontSize: 13 }}>{move.category}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {move.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: 'rgba(220,184,255,0.1)',
                      color: '#dcb8ff',
                    }}
                  >
                    {tag.name_en}
                  </span>
                ))}
                {move.tags.length > 3 && (
                  <span style={{ fontSize: 11, color: '#666' }}>+{move.tags.length - 3}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEditMove(move.id)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#e0e0e0',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => setDeleteTarget(move.id)}
                  style={{
                    background: 'rgba(248,113,113,0.1)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#f87171',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
      </div>

      {modalOpen && (
        <MoveModal
          move={editMove}
          availableTags={availableTags}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('moves.deleteMove')}
        description={t('moves.confirmDelete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
