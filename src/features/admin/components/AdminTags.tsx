'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import {
  createTagAction,
  deleteTagAction,
  getTagsForAdminAction,
  updateTagAction,
} from '../actions';
import type { AdminTagRow } from '../types';

import { ConfirmDialog } from './ConfirmDialog';

const PRESET_COLORS = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#a3e635',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#a78bfa',
  '#e879f9',
  '#f472b6',
  '#94a3b8',
  '#dcb8ff',
];

interface TagFormState {
  name_en: string;
  name_pl: string;
  color: string;
}

const emptyForm: TagFormState = { name_en: '', name_pl: '', color: '' };

export function AdminTags() {
  const t = useTranslations('admin');
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTag, setEditTag] = useState<AdminTagRow | null>(null);
  const [form, setForm] = useState<TagFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTagsForAdminAction()
      .then((data) => {
        if (!cancelled) setTags(data);
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

  function openCreate() {
    setEditTag(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(tag: AdminTagRow) {
    setEditTag(tag);
    setForm({ name_en: tag.name_en, name_pl: tag.name_pl, color: tag.color ?? '' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name_en.trim() || !form.name_pl.trim()) return;
    setSaving(true);
    try {
      if (editTag) {
        await updateTagAction({
          id: editTag.id,
          name_en: form.name_en,
          name_pl: form.name_pl,
          color: form.color || undefined,
        });
      } else {
        await createTagAction({
          name_en: form.name_en,
          name_pl: form.name_pl,
          color: form.color || undefined,
        });
      }
      setModalOpen(false);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTagAction(deleteTarget);
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#e0e0e0',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button onClick={openCreate} style={{ background: '#8458b3', color: '#fff' }}>
          + {t('tags.addTag')}
        </Button>
      </div>

      {loading && <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {tags.map((tag) => (
          <div
            key={tag.id}
            style={{
              background: '#1a1a1a',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: tag.color ?? '#444',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#e0e0e0',
                    fontWeight: 600,
                    fontSize: 14,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tag.name_en}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>{tag.name_pl}</div>
              </div>
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {t('tags.movesCount', { count: tag._count.moves })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => openEdit(tag)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#e0e0e0',
                  padding: '6px 0',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(tag.id)}
                style={{
                  flex: 1,
                  background: 'rgba(248,113,113,0.1)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#f87171',
                  padding: '6px 0',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tag Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              width: '100%',
              maxWidth: 420,
              padding: 28,
            }}
          >
            <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: 18, fontWeight: 600 }}>
              {editTag ? t('tags.editTag') : t('tags.addTag')}
            </h2>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 4 }}>
                Name (EN) *
              </label>
              <Input
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                style={fieldStyle}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 4 }}>
                Nazwa (PL) *
              </label>
              <Input
                value={form.name_pl}
                onChange={(e) => setForm((f) => ({ ...f, name_pl: e.target.value }))}
                style={fieldStyle}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 8 }}>
                Color
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: f.color === c ? '' : c }))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c,
                      border: form.color === c ? '3px solid #fff' : '3px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#e0e0e0',
                  background: 'transparent',
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name_en.trim() || !form.name_pl.trim()}
                style={{ background: '#8458b3', color: '#fff' }}
              >
                {saving ? 'Saving...' : t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('tags.deleteTag')}
        description={t('tags.confirmDelete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
