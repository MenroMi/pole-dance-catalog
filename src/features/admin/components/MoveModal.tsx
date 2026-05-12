'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { type FieldError, type FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import {
  createMoveAction,
  deleteUploadedImageAction,
  searchRelatedMovesAction,
  updateMoveAction,
  uploadMoveImageAction,
} from '../actions';
import type { AdminTagRow, CreateMoveInput, FullAdminMove } from '../types';

interface MoveModalProps {
  move: FullAdminMove | null;
  availableTags: AdminTagRow[];
  onClose: () => void;
  onSaved: () => void;
}

type Tab = 'en' | 'pl' | 'meta' | 'related';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const CATEGORIES = ['SPINS', 'CLIMBS', 'HOLDS', 'COMBOS', 'FLOORWORK'] as const;
const POLE_TYPES = ['STATIC', 'SPIN'] as const;

const YOUTUBE_URL_RE = /^https:\/\/(www\.youtube\.com|youtube\.com|youtu\.be)\//;

function jsonToText(value: unknown): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

function validateStepsJson(text: string): boolean {
  if (!text.trim()) return true;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

function textToSteps(text: string): { text: string; timestamp?: number }[] {
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is { text: string; timestamp?: number } =>
        typeof s === 'object' && s !== null && typeof s.text === 'string',
    );
  } catch {
    return [];
  }
}

const clientMoveSchema = z.object({
  title_en: z.string().min(1, 'fieldRequired'),
  title_pl: z.string().min(1, 'fieldRequired'),
  description_en: z.string(),
  description_pl: z.string(),
  youtubeUrl: z
    .string()
    .min(1, 'fieldRequired')
    .refine((v) => YOUTUBE_URL_RE.test(v), 'youtubeUrlInvalid'),
  stepsData_en: z.string().refine(validateStepsJson, 'invalidJson'),
  stepsData_pl: z.string().refine(validateStepsJson, 'invalidJson'),
  gripType_en: z.string(),
  gripType_pl: z.string(),
  entry_en: z.string(),
  entry_pl: z.string(),
  coachNote_en: z.string(),
  coachNote_pl: z.string(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.enum(['SPINS', 'CLIMBS', 'HOLDS', 'COMBOS', 'FLOORWORK']),
  poleTypes: z.array(z.string()),
  imageUrl: z.string(),
  duration: z.string(),
  coachNoteAuthor: z.string(),
  tagIds: z.array(z.string()).min(1, 'fieldRequired'),
  relatedMoveIds: z.array(z.string()),
});

type FormValues = z.infer<typeof clientMoveSchema>;

type FormErrorKey = 'fieldRequired' | 'youtubeUrlInvalid' | 'invalidJson';

function initFormValues(move: FullAdminMove | null): FormValues {
  if (!move) {
    return {
      title_en: '',
      description_en: '',
      youtubeUrl: '',
      stepsData_en: '',
      gripType_en: '',
      entry_en: '',
      coachNote_en: '',
      title_pl: '',
      description_pl: '',
      stepsData_pl: '',
      gripType_pl: '',
      entry_pl: '',
      coachNote_pl: '',
      difficulty: 'BEGINNER',
      category: 'SPINS',
      poleTypes: [],
      imageUrl: '',
      duration: '',
      coachNoteAuthor: '',
      tagIds: [],
      relatedMoveIds: [],
    };
  }
  return {
    title_en: move.title_en,
    description_en: move.description_en ?? '',
    youtubeUrl: move.youtubeUrl,
    stepsData_en: jsonToText(move.stepsData_en),
    gripType_en: move.gripType_en ?? '',
    entry_en: move.entry_en ?? '',
    coachNote_en: move.coachNote_en ?? '',
    title_pl: move.title_pl,
    description_pl: move.description_pl ?? '',
    stepsData_pl: jsonToText(move.stepsData_pl),
    gripType_pl: move.gripType_pl ?? '',
    entry_pl: move.entry_pl ?? '',
    coachNote_pl: move.coachNote_pl ?? '',
    difficulty: move.difficulty,
    category: move.category,
    poleTypes: move.poleTypes as string[],
    imageUrl: move.imageUrl ?? '',
    duration: move.duration ?? '',
    coachNoteAuthor: move.coachNoteAuthor ?? '',
    tagIds: move.tags.map((t) => t.id),
    relatedMoveIds: move.relatedMoves.map((m) => m.id),
  };
}

const overlayBtnStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.75)',
  border: '1px solid rgba(75,68,80,0.5)',
  borderRadius: 6,
  padding: '5px 12px',
  fontFamily: 'var(--font-manrope)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

function ImageDropZone({
  previewUrl,
  onFileSelect,
  onRemove,
}: {
  previewUrl: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('admin');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(t('moves.fields.imageOnlyImages'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('moves.fields.imageMaxSize'));
      return;
    }
    setError(null);
    onFileSelect(file);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = '';
      }}
    />
  );

  if (previewUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(75,68,80,0.3)',
          }}
        >
          {fileInput}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{ ...overlayBtnStyle, color: '#e2e2e2' }}
            >
              {t('moves.fields.imageChange')}
            </button>
            <button
              type="button"
              onClick={onRemove}
              style={{ ...overlayBtnStyle, color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
            >
              {t('moves.fields.imageRemove')}
            </button>
          </div>
        </div>
        {error && (
          <span style={{ color: '#f87171', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? 'rgba(220,184,255,0.6)' : 'rgba(75,68,80,0.4)'}`,
          borderRadius: 8,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(220,184,255,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'all 150ms',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {fileInput}
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke={dragging ? '#dcb8ff' : '#4b4450'}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 150ms' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span
          style={{
            color: dragging ? '#dcb8ff' : '#6b6270',
            fontFamily: 'var(--font-manrope)',
            fontSize: 13,
            transition: 'color 150ms',
          }}
        >
          {t('moves.fields.imageDrop')}
        </span>
      </div>
      {error && (
        <span style={{ color: '#f87171', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e0e0e0',
  padding: '8px 12px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888',
  fontSize: 13,
  marginBottom: 4,
  fontWeight: 500,
};

const rowStyle: React.CSSProperties = { marginBottom: 14 };

function RelatedMoveRow({
  move: m,
  selected,
  onToggle,
}: {
  move: { id: string; title_en: string; title_pl: string };
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${selected ? 'rgba(220,184,255,0.35)' : 'rgba(75,68,80,0.3)'}`,
        background: selected ? 'rgba(220,184,255,0.08)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 150ms',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${selected ? '#dcb8ff' : 'rgba(75,68,80,0.5)'}`,
          background: selected ? 'rgba(220,184,255,0.25)' : 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms',
        }}
      >
        {selected && (
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2.5 2.5L8 3"
              stroke="#dcb8ff"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div>
        <div
          style={{
            color: '#e2e2e2',
            fontSize: 13,
            fontFamily: 'var(--font-manrope)',
            fontWeight: 500,
          }}
        >
          {m.title_en}
        </div>
        <div style={{ color: '#6b6270', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>
          {m.title_pl}
        </div>
      </div>
    </button>
  );
}

export function MoveModal({ move, availableTags, onClose, onSaved }: MoveModalProps) {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<Tab>('en');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    { id: string; title_en: string; title_pl: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  // Seeded once per mount from relatedMoves; extended by each search result so pinned entries always have titles.
  const knownMovesRef = useRef<Map<string, { title_en: string; title_pl: string }>>(
    new Map(
      move?.relatedMoves.map((m) => [m.id, { title_en: m.title_en, title_pl: m.title_pl }]) ?? [],
    ),
  );
  const [relatedQuery, setRelatedQuery] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(clientMoveSchema),
    defaultValues: initFormValues(move),
    mode: 'onTouched',
  });

  const watchedPoleTypes = watch('poleTypes');
  const watchedTagIds = watch('tagIds');
  const watchedRelatedMoveIds = watch('relatedMoveIds');
  const watchedImageUrl = watch('imageUrl');

  useEffect(() => {
    if (!relatedQuery.trim()) {
      setSearchResults([]);
      setSearchError(false);
      return;
    }
    let cancelled = false;
    setSearchError(false);
    const timer = setTimeout(() => {
      setSearchLoading(true);
      searchRelatedMovesAction({ query: relatedQuery, excludeId: move?.id })
        .then((results) => {
          if (cancelled) return;
          results.forEach((m) =>
            knownMovesRef.current.set(m.id, { title_en: m.title_en, title_pl: m.title_pl }),
          );
          setSearchResults(results);
        })
        .catch(() => {
          if (!cancelled) {
            setSearchError(true);
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [relatedQuery, move?.id]);

  useEffect(() => {
    if (!pendingFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  async function onValidSubmit(data: FormValues) {
    setSaving(true);
    setError(null);
    let uploadedUrl: string | null = null;
    try {
      let resolvedImageUrl: string | null = data.imageUrl || null;
      if (pendingFile) {
        const fd = new FormData();
        fd.append('image', pendingFile);
        const res = await uploadMoveImageAction(fd);
        resolvedImageUrl = res.imageUrl;
        uploadedUrl = res.imageUrl;
      }
      const input: CreateMoveInput = {
        title_en: data.title_en,
        title_pl: data.title_pl,
        description_en: data.description_en || undefined,
        description_pl: data.description_pl || undefined,
        difficulty: data.difficulty,
        category: data.category,
        poleTypes: data.poleTypes as CreateMoveInput['poleTypes'],
        youtubeUrl: data.youtubeUrl,
        imageUrl: resolvedImageUrl,
        gripType_en: data.gripType_en || undefined,
        gripType_pl: data.gripType_pl || undefined,
        entry_en: data.entry_en || undefined,
        entry_pl: data.entry_pl || undefined,
        duration: data.duration || undefined,
        coachNote_en: data.coachNote_en || undefined,
        coachNote_pl: data.coachNote_pl || undefined,
        coachNoteAuthor: data.coachNoteAuthor || undefined,
        stepsData_en: textToSteps(data.stepsData_en),
        stepsData_pl: textToSteps(data.stepsData_pl),
        tagIds: data.tagIds,
        relatedMoveIds: data.relatedMoveIds,
      };
      if (move) {
        await updateMoveAction({ ...input, id: move.id });
      } else {
        await createMoveAction(input);
      }
      onSaved();
    } catch (e) {
      if (uploadedUrl) {
        deleteUploadedImageAction(uploadedUrl).catch((err) =>
          console.error('[MoveModal] cleanup upload failed:', err),
        );
      }
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function onInvalidSubmit(errs: FieldErrors<FormValues>) {
    if (errs.title_en || errs.stepsData_en) {
      setTab('en');
      return;
    }
    if (errs.title_pl || errs.stepsData_pl) {
      setTab('pl');
      return;
    }
    if (errs.youtubeUrl || errs.tagIds) setTab('meta');
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'en', label: t('moves.tabs.en') },
    { key: 'pl', label: t('moves.tabs.pl') },
    { key: 'meta', label: t('moves.tabs.meta') },
    { key: 'related', label: t('moves.tabs.related') },
  ];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [saving, onClose]);

  function tabHasError(key: Tab): boolean {
    switch (key) {
      case 'en':
        return !!(errors.title_en || errors.stepsData_en);
      case 'pl':
        return !!(errors.title_pl || errors.stepsData_pl);
      case 'meta':
        return !!(errors.youtubeUrl || errors.tagIds);
      default:
        return false;
    }
  }

  // Always pin ALL selected moves — no flicker when they enter/leave search results.
  const pinnedSelected = watchedRelatedMoveIds.flatMap((id) => {
    const info = knownMovesRef.current.get(id);
    return info ? [{ id, ...info }] : [];
  });
  // Exclude selected from the search results list to avoid double display.
  const selectedSet = new Set(watchedRelatedMoveIds);
  const visibleSearchResults = searchResults.filter((m) => !selectedSet.has(m.id));

  return (
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
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: 640,
          minHeight: 480,
          overflowX: 'hidden',
          maxHeight: 'min(870px, 90vh)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, color: '#e0e0e0', fontSize: 18, fontWeight: 600 }}>
            {move ? t('moves.editMove') : t('moves.addMove')}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: saving ? '#4b4450' : '#888',
              cursor: saving ? 'default' : 'pointer',
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: '16px 24px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: '8px 20px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === key ? '#dcb8ff' : 'transparent'}`,
                color: tab === key ? '#dcb8ff' : '#888',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === key ? 600 : 400,
                marginBottom: -1,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {label}
              {tabHasError(key) && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#f87171',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'en' && (
            <div className="p-6">
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.titleEn')} *</label>
                <Input
                  {...register('title_en')}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    borderColor: errors.title_en ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={t('moves.fields.titleEnPlaceholder')}
                />
                {errors.title_en?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t(errors.title_en.message as FormErrorKey)}
                  </span>
                )}
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.descriptionEn')}</label>
                <textarea
                  {...register('description_en')}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder={t('moves.fields.optionalDescription')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.gripTypeEn')}</label>
                <Input
                  {...register('gripType_en')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.gripTypeEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.entryEn')}</label>
                <Input
                  {...register('entry_en')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.entryEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNoteEn')}</label>
                <textarea
                  {...register('coachNote_en')}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                  placeholder={t('moves.fields.coachNoteEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.stepsEn')}</label>
                <textarea
                  {...register('stepsData_en')}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                    borderColor: errors.stepsData_en ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"text": "Start", "timestamp": 0}\n]'}
                />
                {errors.stepsData_en?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t(errors.stepsData_en.message as FormErrorKey)}
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'pl' && (
            <div className="p-6">
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.titlePl')} *</label>
                <Input
                  {...register('title_pl')}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    borderColor: errors.title_pl ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={t('moves.fields.titlePlPlaceholder')}
                />
                {errors.title_pl?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t(errors.title_pl.message as FormErrorKey)}
                  </span>
                )}
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.descriptionPl')}</label>
                <textarea
                  {...register('description_pl')}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder={t('moves.fields.optionalDescription')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.gripTypePl')}</label>
                <Input
                  {...register('gripType_pl')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.gripTypePlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.entryPl')}</label>
                <Input
                  {...register('entry_pl')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.entryPlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNotePl')}</label>
                <textarea
                  {...register('coachNote_pl')}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                  placeholder={t('moves.fields.coachNotePlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.stepsPl')}</label>
                <textarea
                  {...register('stepsData_pl')}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                    borderColor: errors.stepsData_pl ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"text": "Start", "timestamp": 0}\n]'}
                />
                {errors.stepsData_pl?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t(errors.stepsData_pl.message as FormErrorKey)}
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div className="p-6">
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.youtubeUrl')} *</label>
                <Input
                  {...register('youtubeUrl')}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    borderColor: errors.youtubeUrl ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={t('moves.fields.youtubeUrlPlaceholder')}
                />
                {errors.youtubeUrl?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t(errors.youtubeUrl.message as FormErrorKey)}
                  </span>
                )}
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.difficulty')} *</label>
                <select {...register('difficulty')} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d} style={{ background: '#1a1a1a' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.category')} *</label>
                <select {...register('category')} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#1a1a1a' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.poleTypes')}</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {POLE_TYPES.map((pt) => (
                    <label
                      key={pt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        color: '#e0e0e0',
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={watchedPoleTypes.includes(pt)}
                        onChange={() => {
                          setValue(
                            'poleTypes',
                            watchedPoleTypes.includes(pt)
                              ? watchedPoleTypes.filter((p) => p !== pt)
                              : [...watchedPoleTypes, pt],
                          );
                        }}
                      />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.imageUrl')}</label>
                <ImageDropZone
                  previewUrl={objectUrl ?? watchedImageUrl}
                  onFileSelect={(file) => setPendingFile(file)}
                  onRemove={() => {
                    setPendingFile(null);
                    setValue('imageUrl', '');
                  }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.duration')}</label>
                <Input
                  {...register('duration')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.durationPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNoteAuthor')}</label>
                <Input
                  {...register('coachNoteAuthor')}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.coachNoteAuthorPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.tags')} *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setValue(
                          'tagIds',
                          watchedTagIds.includes(tag.id)
                            ? watchedTagIds.filter((id) => id !== tag.id)
                            : [...watchedTagIds, tag.id],
                          { shouldValidate: true },
                        );
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        border: `1px solid ${watchedTagIds.includes(tag.id) ? '#dcb8ff' : 'rgba(255,255,255,0.15)'}`,
                        background: watchedTagIds.includes(tag.id)
                          ? 'rgba(220,184,255,0.15)'
                          : 'transparent',
                        color: watchedTagIds.includes(tag.id) ? '#dcb8ff' : '#888',
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 150ms',
                      }}
                    >
                      {tag.name_en}
                    </button>
                  ))}
                </div>
                {(errors.tagIds as FieldError | undefined)?.message && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t((errors.tagIds as FieldError).message as FormErrorKey)}
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'related' && (
            <>
              <div
                style={{
                  position: 'sticky',
                  padding: '12px 24px 8px',
                  top: 0,
                  zIndex: 1,
                  background: '#1a1a1a',
                }}
              >
                <Input
                  className="admin-field"
                  style={fieldStyle}
                  value={relatedQuery}
                  onChange={(e) => setRelatedQuery(e.target.value)}
                  placeholder={t('moves.fields.relatedSearchPlaceholder')}
                />
                {watchedRelatedMoveIds.length > 0 && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 6,
                      color: '#6b6270',
                      fontSize: 12,
                      fontFamily: 'var(--font-manrope)',
                    }}
                  >
                    {t('moves.fields.relatedSelectedCount', {
                      count: watchedRelatedMoveIds.length,
                    })}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '0 24px 12px 24px',
                }}
              >
                {/* All selected moves are always pinned here — no flicker */}
                {pinnedSelected.map((m) => (
                  <RelatedMoveRow
                    key={m.id}
                    move={m}
                    selected
                    onToggle={() =>
                      setValue(
                        'relatedMoveIds',
                        watchedRelatedMoveIds.filter((id) => id !== m.id),
                      )
                    }
                  />
                ))}

                {/* Empty state */}
                {!relatedQuery.trim() && pinnedSelected.length === 0 && (
                  <span
                    style={{
                      color: '#6b6270',
                      fontSize: 13,
                      fontFamily: 'var(--font-manrope)',
                      padding: '24px 0',
                      textAlign: 'center',
                    }}
                  >
                    {t('moves.fields.relatedStartTyping')}
                  </span>
                )}

                {/* Loading */}
                {searchLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: '#dcb8ff' }} />
                  </div>
                )}

                {/* Search error */}
                {!searchLoading && searchError && (
                  <span
                    style={{ color: '#f87171', fontSize: 13, fontFamily: 'var(--font-manrope)' }}
                  >
                    {t('moves.fields.relatedSearchError')}
                  </span>
                )}

                {/* No results */}
                {!searchLoading &&
                  !searchError &&
                  relatedQuery.trim() &&
                  searchResults.length === 0 && (
                    <span
                      style={{ color: '#6b6270', fontSize: 13, fontFamily: 'var(--font-manrope)' }}
                    >
                      {t('moves.fields.relatedNoResults')}
                    </span>
                  )}

                {/* Search results (selected ones shown in pinned section above) */}
                {visibleSearchResults.map((m) => (
                  <RelatedMoveRow
                    key={m.id}
                    move={m}
                    selected={false}
                    onToggle={() => setValue('relatedMoveIds', [...watchedRelatedMoveIds, m.id])}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {error && (
            <span
              style={{
                color: '#f87171',
                fontSize: 14,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {error}
            </span>
          )}
          <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', gap: 12 }}>
            <Button
              variant="outline"
              onClick={onClose}
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
              type="button"
              onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
              disabled={saving}
              style={{
                background: '#8458b3',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0 }} />}
              {saving ? t('moves.saving') : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
