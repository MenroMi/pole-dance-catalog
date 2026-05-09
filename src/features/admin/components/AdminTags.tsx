'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import {
  createTagAction,
  deleteTagAction,
  getTagsForAdminAction,
  updateTagAction,
} from '../actions';
import type { AdminTagRow } from '../types';

const DEFAULT_COLOR = '#dcb8ff';

function randomHex() {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  );
}

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    Search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    Plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    Tag: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
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

interface TagFormState {
  name_en: string;
  name_pl: string;
  color: string;
}

const emptyForm: TagFormState = { name_en: '', name_pl: '', color: DEFAULT_COLOR };

function TagCard({
  tag,
  onEdit,
  onDelete,
}: {
  tag: AdminTagRow;
  onEdit: (t: AdminTagRow) => void;
  onDelete: (t: AdminTagRow) => void;
}) {
  const t = useTranslations('admin');
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#222' : '#1b1b1b',
        border: hov ? '1px solid rgba(220,184,255,0.2)' : '1px solid rgba(75,68,80,0.2)',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 200ms ease',
        boxShadow: hov ? '0 4px 20px -4px rgba(132,88,179,0.2)' : 'none',
      }}
    >
      {/* Color icon + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: tag.color ? `${tag.color}28` : 'rgba(75,68,80,0.2)',
            border: `1px solid ${tag.color || '#6b6270'}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: tag.color || '#978e9b' }}>
            <NavIcon name="Tag" size={16} />
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#6b6270',
            fontFamily: 'var(--font-manrope)',
            textTransform: 'uppercase',
          }}
        >
          {t('tags.movesCount', { count: tag._count.moves })}
        </span>
      </div>
      {/* Names */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 16,
            fontWeight: 600,
            color: '#e2e2e2',
            marginBottom: 2,
          }}
        >
          {tag.name_en}
        </div>
        <div style={{ fontSize: 13, color: '#6b6270', fontFamily: 'var(--font-manrope)' }}>
          {tag.name_pl}
        </div>
      </div>
      {/* Color swatch */}
      {tag.color && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 9999,
            background: `${tag.color}18`,
            alignSelf: 'flex-start',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tag.color,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-manrope)',
              color: tag.color,
              fontWeight: 600,
            }}
          >
            {tag.color}
          </span>
        </div>
      )}
      {/* Actions (hover-reveal) */}
      <div style={{ display: 'flex', gap: 6, opacity: hov ? 1 : 0, transition: 'opacity 150ms' }}>
        <button
          onClick={() => onEdit(tag)}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: '7px 0',
            color: '#978e9b',
            cursor: 'pointer',
            fontFamily: 'var(--font-manrope)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
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
          <NavIcon name="Edit" size={12} /> {t('edit')}
        </button>
        <button
          onClick={() => onDelete(tag)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(75,68,80,0.4)',
            borderRadius: 6,
            padding: 7,
            color: '#978e9b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

function TagModal({
  tag,
  onSave,
  onClose,
  saving,
  error,
}: {
  tag: AdminTagRow | null;
  onSave: (form: TagFormState) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error?: string | null;
}) {
  const t = useTranslations('admin');
  const isEdit = !!tag;
  const [form, setForm] = useState<TagFormState>(
    tag
      ? { name_en: tag.name_en, name_pl: tag.name_pl, color: tag.color ?? DEFAULT_COLOR }
      : { ...emptyForm },
  );
  const [focusEn, setFocusEn] = useState(false);
  const [focusPl, setFocusPl] = useState(false);
  const [focusHex, setFocusHex] = useState(false);
  const [hexError, setHexError] = useState('');
  const colorInputRef = useRef<HTMLInputElement>(null);

  function set(k: keyof TagFormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#171717',
          border: '1px solid rgba(75,68,80,0.4)',
          borderRadius: 16,
          padding: 32,
          width: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          animation: 'fadeUp 200ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 24,
            fontWeight: 600,
            color: '#e2e2e2',
            margin: '0 0 24px',
            letterSpacing: '-0.02em',
          }}
        >
          {isEdit ? t('tags.editTag') : t('tags.addTag')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* EN */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: focusEn ? '#dcb8ff' : '#978e9b',
                fontFamily: 'var(--font-manrope)',
                transition: 'color 180ms',
              }}
            >
              {t('tags.nameEnLabel')}
            </span>
            <input
              value={form.name_en}
              onChange={(e) => set('name_en', e.target.value)}
              onFocus={() => setFocusEn(true)}
              onBlur={() => setFocusEn(false)}
              placeholder={t('tags.placeholderEn')}
              style={{
                background: '#131313',
                border: focusEn
                  ? '1px solid rgba(220,184,255,0.5)'
                  : '1px solid rgba(75,68,80,0.4)',
                borderRadius: 8,
                color: '#e2e2e2',
                fontFamily: 'var(--font-manrope)',
                fontSize: 14,
                padding: '10px 14px',
                outline: 'none',
                transition: 'border-color 180ms',
              }}
            />
          </label>
          {/* PL */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: focusPl ? '#dcb8ff' : '#978e9b',
                fontFamily: 'var(--font-manrope)',
                transition: 'color 180ms',
              }}
            >
              {t('tags.namePlLabel')}
            </span>
            <input
              value={form.name_pl}
              onChange={(e) => set('name_pl', e.target.value)}
              onFocus={() => setFocusPl(true)}
              onBlur={() => setFocusPl(false)}
              placeholder={t('tags.placeholderPl')}
              style={{
                background: '#131313',
                border: focusPl
                  ? '1px solid rgba(220,184,255,0.5)'
                  : '1px solid rgba(75,68,80,0.4)',
                borderRadius: 8,
                color: '#e2e2e2',
                fontFamily: 'var(--font-manrope)',
                fontSize: 14,
                padding: '10px 14px',
                outline: 'none',
                transition: 'border-color 180ms',
              }}
            />
          </label>
          {/* Color */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#978e9b',
                fontFamily: 'var(--font-manrope)',
                marginBottom: 10,
              }}
            >
              {t('tags.colorLabel')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Swatch — clicks native color picker */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: form.color || DEFAULT_COLOR,
                  border: '2px solid rgba(75,68,80,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220,184,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
                }}
              />
              {/* Hidden native color input */}
              <input
                ref={colorInputRef}
                type="color"
                value={form.color || DEFAULT_COLOR}
                onChange={(e) => {
                  set('color', e.target.value);
                  setHexError('');
                }}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  width: 0,
                  height: 0,
                }}
              />
              {/* Hex text field */}
              <input
                value={form.color}
                onChange={(e) => {
                  const v = e.target.value;
                  set('color', v);
                }}
                onFocus={() => setFocusHex(true)}
                onBlur={() => {
                  setFocusHex(false);
                  if (form.color && !/^#[0-9a-fA-F]{6}$/.test(form.color)) {
                    setHexError('Must be a valid hex color (e.g. #dcb8ff)');
                  } else {
                    setHexError('');
                  }
                }}
                placeholder={DEFAULT_COLOR}
                maxLength={7}
                style={{
                  height: 40,
                  background: '#131313',
                  border: focusHex
                    ? '1px solid rgba(220,184,255,0.5)'
                    : '1px solid rgba(75,68,80,0.4)',
                  borderRadius: 8,
                  color: '#e2e2e2',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  padding: '9px 14px',
                  outline: 'none',
                  width: 110,
                  letterSpacing: '0.04em',
                  transition: 'border-color 180ms',
                }}
              />
              {/* Randomize button */}
              <button
                type="button"
                onClick={() => {
                  set('color', randomHex());
                  setHexError('');
                }}
                style={{
                  height: 40,
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(75,68,80,0.4)',
                  color: '#978e9b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  flexShrink: 0,
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220,184,255,0.5)';
                  e.currentTarget.style.color = '#dcb8ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(75,68,80,0.4)';
                  e.currentTarget.style.color = '#978e9b';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                </svg>
                {t('tags.randomColor')}
              </button>
            </div>
            {form.name_en && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 12, color: '#6b6270', fontFamily: 'var(--font-manrope)' }}>
                  {t('tags.preview')}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: form.color ? `${form.color}28` : 'rgba(75,68,80,0.2)',
                    color: form.color || '#978e9b',
                    fontFamily: 'var(--font-manrope)',
                  }}
                >
                  {form.name_en}
                </span>
              </div>
            )}
            {hexError && (
              <div
                style={{
                  fontSize: 12,
                  color: '#f87171',
                  fontFamily: 'var(--font-manrope)',
                  marginTop: 6,
                }}
              >
                {hexError}
              </div>
            )}
          </div>
        </div>
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              fontFamily: 'var(--font-manrope)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(75,68,80,0.4)',
              borderRadius: 8,
              padding: '9px 22px',
              color: '#cdc3d2',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name_en || !form.name_pl || saving || !!hexError}
            style={{
              background:
                form.name_en && form.name_pl && !hexError
                  ? 'linear-gradient(135deg,#dcb8ff,#8458b3,#dcb8ff)'
                  : '#2a2a2a',
              backgroundSize: '200% 200%',
              backgroundPosition: 'left center',
              border: 'none',
              borderRadius: 8,
              padding: '9px 26px',
              color: '#f8ebff',
              fontFamily: 'var(--font-manrope)',
              fontSize: 14,
              fontWeight: 600,
              cursor:
                form.name_en && form.name_pl && !saving && !hexError ? 'pointer' : 'not-allowed',
              opacity: form.name_en && form.name_pl && !hexError ? 1 : 0.5,
              boxShadow:
                form.name_en && form.name_pl && !hexError
                  ? '0 4px 16px -2px rgba(132,88,179,0.4)'
                  : 'none',
              transition: 'background-position 400ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundPosition = 'right center';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundPosition = 'left center';
            }}
          >
            {saving ? '…' : isEdit ? t('save') : t('tags.addTag')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTags() {
  const t = useTranslations('admin');
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<AdminTagRow | null>(null);
  const [deleteTag, setDeleteTag] = useState<AdminTagRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!hasFetchedRef.current) setLoading(true);
    else setIsFetching(true);
    getTagsForAdminAction()
      .then((data) => {
        if (!cancelled) {
          hasFetchedRef.current = true;
          setTags(data);
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load tags');
      })
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

  const filtered = tags.filter(
    (t) =>
      !query ||
      t.name_en.toLowerCase().includes(query.toLowerCase()) ||
      t.name_pl.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleCreate(form: TagFormState) {
    setSaving(true);
    setModalError(null);
    try {
      await createTagAction({
        name_en: form.name_en,
        name_pl: form.name_pl,
        color: form.color || undefined,
      });
      setCreateOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : t('error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: TagFormState) {
    if (!editTag) return;
    setSaving(true);
    setModalError(null);
    try {
      await updateTagAction({
        id: editTag.id,
        name_en: form.name_en,
        name_pl: form.name_pl,
        color: form.color || undefined,
      });
      setEditTag(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : t('error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTag) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTagAction(deleteTag.id);
      setDeleteTag(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('error'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: '32px 40px 80px' }}>
      {/* Header */}
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
            {t('tags.taxonomy')} · {tags.length} {t('tags.title').toLowerCase()}
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
            {t('tags.title').toLowerCase()}
          </h1>
        </div>
        <button
          onClick={() => {
            setCreateOpen(true);
            setModalError(null);
          }}
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
            transition: 'background-position 400ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundPosition = 'right center';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundPosition = 'left center';
          }}
        >
          <NavIcon name="Plus" size={14} /> {t('tags.addTag').toLowerCase()}
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          maxWidth: 360,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#1b1b1b',
          border: '1px solid rgba(75,68,80,0.3)',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 24,
        }}
      >
        <span style={{ color: '#978e9b', display: 'flex' }}>
          <NavIcon name="Search" size={14} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('tags.search')}
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

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>{t('loading')}</div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div
          style={{
            margin: '0 0 12px',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            color: '#f87171',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ flex: 1 }}>{loadError}</span>
          <button
            type="button"
            onClick={() => {
              setLoadError(null);
              setRefreshKey((k) => k + 1);
            }}
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

      {/* Grid */}
      {!loading && !loadError && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
            opacity: isFetching ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {filtered.map((t) => (
            <TagCard
              key={t.id}
              tag={t}
              onEdit={(tag) => {
                setEditTag(tag);
                setModalError(null);
              }}
              onDelete={setDeleteTag}
            />
          ))}
        </div>
      )}

      {/* Tag modal (create or edit) */}
      {(createOpen || editTag !== null) && (
        <TagModal
          tag={editTag}
          onSave={editTag ? handleEdit : handleCreate}
          onClose={() => {
            setCreateOpen(false);
            setEditTag(null);
            setModalError(null);
          }}
          saving={saving}
          error={modalError}
        />
      )}

      {/* Delete confirm */}
      {deleteTag && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            setDeleteTag(null);
            setDeleteError(null);
          }}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1b1b1b',
              border: '1px solid rgba(75,68,80,0.4)',
              borderRadius: 16,
              padding: 36,
              width: 380,
              animation: 'fadeUp 200ms cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 22,
                fontWeight: 600,
                color: '#e2e2e2',
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              {t('tags.deleteTag').toLowerCase()}?
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
              <strong style={{ color: '#e2e2e2' }}>{deleteTag.name_en}</strong>{' '}
              {t('tags.confirmDelete')} ({deleteTag._count.moves} {t('tags.movesLabel')})
            </p>
            {deleteError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setDeleteTag(null);
                  setDeleteError(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(75,68,80,0.4)',
                  borderRadius: 8,
                  padding: '9px 20px',
                  color: '#cdc3d2',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#b3261e',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 22px',
                  color: '#fff',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? '…' : t('delete').toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
