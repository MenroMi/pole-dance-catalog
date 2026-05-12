'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Category, Difficulty } from '@prisma/client';
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

type RelatedMoveInfo = {
  id: string;
  title_en: string;
  title_pl: string;
  difficulty: Difficulty;
  category: Category;
  favourites: number;
};

const DIFF_STYLES: Record<string, { bg: string; fg: string }> = {
  BEGINNER: { bg: 'rgba(132,209,153,0.15)', fg: '#84d099' },
  INTERMEDIATE: { bg: 'rgba(132,88,179,0.20)', fg: '#c5afe2' },
  ADVANCED: { bg: 'rgba(251,191,36,0.14)', fg: '#fbbf24' },
};

const CAT_GLYPHS: Record<string, string> = {
  SPINS: '⌇',
  HOLDS: '◉',
  CLIMBS: '⌥',
  COMBOS: '✦',
  FLOORWORK: '⟡',
};

function RelatedMoveRow({
  move: m,
  selected,
  onToggle,
  isNew = false,
  animationDelay = 0,
}: {
  move: RelatedMoveInfo;
  selected: boolean;
  onToggle: () => void;
  isNew?: boolean;
  animationDelay?: number;
}) {
  const [hov, setHov] = useState(false);
  const dc = DIFF_STYLES[m.difficulty] ?? DIFF_STYLES.BEGINNER;
  const glyph = CAT_GLYPHS[m.category] ?? '◇';

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={m.title_en}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        border: selected
          ? '1px solid rgba(220,184,255,0.3)'
          : hov
            ? '1px solid rgba(75,68,80,0.4)'
            : '1px solid transparent',
        background: selected
          ? 'rgba(220,184,255,0.06)'
          : hov
            ? 'rgba(255,255,255,0.025)'
            : 'transparent',
        transition: 'all 160ms ease',
        animation: isNew ? 'slide-down 200ms ease both' : 'none',
        animationDelay: isNew ? `${animationDelay}ms` : '0ms',
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          flexShrink: 0,
          border: selected ? '1.5px solid #dcb8ff' : '1.5px solid rgba(75,68,80,0.6)',
          background: selected ? 'rgba(220,184,255,0.2)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 180ms ease',
        }}
      >
        {selected && (
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2.5 2.5L8 3"
              stroke="#dcb8ff"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Glyph tile */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          flexShrink: 0,
          background: selected
            ? 'linear-gradient(135deg,rgba(220,184,255,0.15),rgba(132,88,179,0.1))'
            : 'linear-gradient(135deg,#0e0e0e,#1f1f1f)',
          border: selected ? '1px solid rgba(220,184,255,0.2)' : '1px solid rgba(75,68,80,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 180ms',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 16,
            color: selected ? 'rgba(220,184,255,0.7)' : 'rgba(220,184,255,0.3)',
            transition: 'color 180ms',
          }}
        >
          {glyph}
        </span>
      </div>

      {/* Titles */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 14,
            fontWeight: 500,
            color: selected ? '#dcb8ff' : '#e2e2e2',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 160ms',
          }}
        >
          {m.title_en}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#4b4450',
            fontFamily: 'var(--font-manrope)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {m.title_pl}
        </div>
      </div>

      {/* Difficulty + category */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 9999,
            fontFamily: 'var(--font-manrope)',
            background: dc.bg,
            color: dc.fg,
            opacity: selected ? 1 : 0.7,
            transition: 'opacity 160ms',
          }}
        >
          {m.difficulty.slice(0, 3)}
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#4b4450',
            fontFamily: 'var(--font-manrope)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {m.category}
        </span>
      </div>

      {/* Favourites */}
      <div
        style={{
          fontSize: 11,
          color: selected ? 'rgba(220,184,255,0.5)' : '#4b4450',
          fontFamily: 'var(--font-manrope)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexShrink: 0,
          minWidth: 36,
          justifyContent: 'flex-end',
          transition: 'color 160ms',
        }}
      >
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {m.favourites}
      </div>
    </button>
  );
}

function SelectedPill({ move: m, onRemove }: { move: RelatedMoveInfo; onRemove: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 8px',
        borderRadius: 9999,
        background: hov ? 'rgba(220,184,255,0.18)' : 'rgba(220,184,255,0.1)',
        border: '1px solid rgba(220,184,255,0.3)',
        animation: 'pop-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        transition: 'background 150ms',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: 11,
          fontWeight: 600,
          color: '#dcb8ff',
          whiteSpace: 'nowrap',
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {m.title_en}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: hov ? '#dcb8ff' : 'rgba(220,184,255,0.5)',
          display: 'flex',
          padding: 0,
          transition: 'color 150ms',
        }}
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function SkeletonRow({ i }: { i: number }) {
  const shimmer: React.CSSProperties = {
    background:
      'linear-gradient(90deg, rgba(75,68,80,0.1) 25%, rgba(75,68,80,0.25) 50%, rgba(75,68,80,0.1) 75%)',
    backgroundSize: '200% 100%',
    animation: `shimmer 1.4s ease-in-out infinite`,
    animationDelay: `${i * 80}ms`,
    borderRadius: 4,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, ...shimmer, flexShrink: 0 }} />
      <div style={{ width: 36, height: 36, borderRadius: 8, ...shimmer, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div
          style={{ height: 13, width: `${55 + ((i * 17) % 30)}%`, ...shimmer, marginBottom: 6 }}
        />
        <div style={{ height: 11, width: `${30 + ((i * 13) % 20)}%`, ...shimmer }} />
      </div>
      <div style={{ height: 20, width: 70, ...shimmer, borderRadius: 9999 }} />
    </div>
  );
}

export function MoveModal({ move, availableTags, onClose, onSaved }: MoveModalProps) {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<Tab>('en');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closeHov, setCloseHov] = useState(false);
  const [clearSearchHov, setClearSearchHov] = useState(false);
  const [clearAllHov, setClearAllHov] = useState(false);
  const [searchResults, setSearchResults] = useState<RelatedMoveInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  // Seeded once per mount from relatedMoves; extended by each search result so pinned entries always have full info.
  const knownMovesRef = useRef<Map<string, Omit<RelatedMoveInfo, 'id'>>>(
    new Map(
      move?.relatedMoves.map((m) => [
        m.id,
        {
          title_en: m.title_en,
          title_pl: m.title_pl,
          difficulty: m.difficulty,
          category: m.category,
          favourites: m.favourites,
        },
      ]) ?? [],
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
    if (tab !== 'related') setRelatedQuery('');
  }, [tab]);

  useEffect(() => {
    if (!relatedQuery.trim()) {
      setSearchResults([]);
      setSearchError(false);
      setSearchLoading(false);
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
            knownMovesRef.current.set(m.id, {
              title_en: m.title_en,
              title_pl: m.title_pl,
              difficulty: m.difficulty,
              category: m.category,
              favourites: m.favourites,
            }),
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
            onMouseEnter={() => {
              if (!saving) setCloseHov(true);
            }}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              background: closeHov ? 'rgba(75,68,80,0.25)' : 'rgba(75,68,80,0.15)',
              border: '1px solid rgba(75,68,80,0.35)',
              borderRadius: 8,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: saving ? '#4b4450' : closeHov ? '#e2e2e2' : '#978e9b',
              cursor: saving ? 'default' : 'pointer',
              transition: 'all 150ms',
            }}
          >
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: '16px 24px 0',
            borderBottom: '1px solid rgba(75,68,80,0.22)',
          }}
        >
          {tabs.map(({ key, label }) => {
            const active = tab === key;
            const isRelated = key === 'related';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${active ? '#dcb8ff' : 'transparent'}`,
                  color: active ? '#dcb8ff' : '#978e9b',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-manrope)',
                  letterSpacing: '0.01em',
                  marginBottom: -1,
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
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
                {isRelated && watchedRelatedMoveIds.length > 0 && (
                  <span
                    style={{
                      background: active ? 'rgba(220,184,255,0.25)' : 'rgba(75,68,80,0.3)',
                      color: active ? '#dcb8ff' : '#978e9b',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: 9999,
                      fontFamily: 'var(--font-manrope)',
                      transition: 'all 150ms',
                    }}
                  >
                    {watchedRelatedMoveIds.length}
                  </span>
                )}
              </button>
            );
          })}
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
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Sticky search header */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#1a1a1a',
                  padding: '14px 24px 10px',
                  borderBottom:
                    pinnedSelected.length > 0 || relatedQuery
                      ? '1px solid rgba(75,68,80,0.15)'
                      : 'none',
                }}
              >
                {/* Search input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#131313',
                    border: `1px solid ${relatedQuery ? 'rgba(220,184,255,0.35)' : 'rgba(75,68,80,0.4)'}`,
                    borderRadius: 10,
                    padding: '9px 14px',
                    transition: 'border-color 180ms',
                  }}
                >
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={relatedQuery ? '#dcb8ff' : '#4b4450'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, transition: 'stroke 180ms' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    value={relatedQuery}
                    onChange={(e) => setRelatedQuery(e.target.value)}
                    placeholder={t('moves.fields.relatedSearchPlaceholder')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      color: '#e2e2e2',
                      fontFamily: 'var(--font-manrope)',
                      fontSize: 14,
                    }}
                  />
                  {searchLoading && (
                    <div
                      className="animate-spin"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid rgba(220,184,255,0.15)',
                        borderTopColor: '#dcb8ff',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {relatedQuery && !searchLoading && (
                    <button
                      type="button"
                      onClick={() => setRelatedQuery('')}
                      onMouseEnter={() => setClearSearchHov(true)}
                      onMouseLeave={() => setClearSearchHov(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: clearSearchHov ? '#978e9b' : '#4b4450',
                        display: 'flex',
                        flexShrink: 0,
                        transition: 'color 150ms',
                      }}
                    >
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Selected pills */}
                {pinnedSelected.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#4b4450',
                        fontFamily: 'var(--font-manrope)',
                        flexShrink: 0,
                        marginRight: 2,
                      }}
                    >
                      {t('moves.fields.relatedSelected')}
                    </span>
                    {pinnedSelected.map((m) => (
                      <SelectedPill
                        key={m.id}
                        move={m}
                        onRemove={() =>
                          setValue(
                            'relatedMoveIds',
                            watchedRelatedMoveIds.filter((id) => id !== m.id),
                          )
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setValue('relatedMoveIds', [])}
                      onMouseEnter={() => setClearAllHov(true)}
                      onMouseLeave={() => setClearAllHov(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: clearAllHov ? '#ef4444' : '#4b4450',
                        fontFamily: 'var(--font-manrope)',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '3px 6px',
                        borderRadius: 4,
                        transition: 'color 150ms',
                        flexShrink: 0,
                      }}
                    >
                      {t('moves.fields.relatedClearAll')}
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable results */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 16px' }}>
                {/* Pinned selected rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                </div>

                {/* Divider between selected and search results */}
                {pinnedSelected.length > 0 &&
                  (searchLoading || visibleSearchResults.length > 0) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        margin: '6px 0 10px',
                      }}
                    >
                      <div style={{ flex: 1, height: 1, background: 'rgba(75,68,80,0.2)' }} />
                      {relatedQuery &&
                        !searchLoading &&
                        !searchError &&
                        visibleSearchResults.length > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#4b4450',
                              fontFamily: 'var(--font-manrope)',
                              fontWeight: 600,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('moves.fields.relatedResultCount', {
                              count: visibleSearchResults.length,
                            })}
                          </span>
                        )}
                      <div style={{ flex: 1, height: 1, background: 'rgba(75,68,80,0.2)' }} />
                    </div>
                  )}

                {/* Skeleton loading */}
                {searchLoading && [0, 1, 2, 3].map((i) => <SkeletonRow key={i} i={i} />)}

                {/* Search error */}
                {!searchLoading && searchError && (
                  <span
                    style={{
                      color: '#f87171',
                      fontSize: 13,
                      fontFamily: 'var(--font-manrope)',
                      padding: '8px 14px',
                      display: 'block',
                    }}
                  >
                    {t('moves.fields.relatedSearchError')}
                  </span>
                )}

                {/* No results */}
                {!searchLoading &&
                  !searchError &&
                  relatedQuery.trim() &&
                  visibleSearchResults.length === 0 && (
                    <div
                      style={{
                        padding: '40px 0',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(75,68,80,0.15)',
                          border: '1px solid rgba(75,68,80,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#4b4450',
                          marginBottom: 4,
                        }}
                      >
                        <svg
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-space-grotesk)',
                          fontSize: 15,
                          fontWeight: 500,
                          color: '#978e9b',
                        }}
                      >
                        {t('moves.fields.relatedNoResults')}{' '}
                        <em style={{ color: '#dcb8ff', fontStyle: 'italic' }}>
                          {relatedQuery.length > 40
                            ? `${relatedQuery.slice(0, 40)}…`
                            : relatedQuery}
                        </em>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#4b4450',
                          fontFamily: 'var(--font-manrope)',
                        }}
                      >
                        {t('moves.fields.relatedNoResultsHint')}
                      </div>
                    </div>
                  )}

                {/* Empty state — no query, nothing selected */}
                {!relatedQuery.trim() && pinnedSelected.length === 0 && (
                  <div
                    style={{
                      padding: '44px 0',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background:
                          'linear-gradient(135deg,rgba(220,184,255,0.08),rgba(132,88,179,0.06))',
                        border: '1px solid rgba(220,184,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <svg
                        width={26}
                        height={26}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(220,184,255,0.5)"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        fontSize: 17,
                        fontWeight: 500,
                        color: '#978e9b',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t('moves.fields.relatedEmptyTitle')}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#4b4450',
                        fontFamily: 'var(--font-manrope)',
                        lineHeight: 1.6,
                        maxWidth: 280,
                      }}
                    >
                      {t('moves.fields.relatedEmptyDesc')}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: '#4b4450',
                        fontFamily: 'var(--font-manrope)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <kbd
                        style={{
                          background: '#1b1b1b',
                          border: '1px solid rgba(75,68,80,0.4)',
                          borderRadius: 4,
                          padding: '2px 7px',
                          fontSize: 10,
                          color: '#4b4450',
                          fontFamily: 'var(--font-manrope)',
                        }}
                      >
                        Type
                      </kbd>
                      {t('moves.fields.relatedEmptyHint')}
                    </div>
                  </div>
                )}

                {/* Search results */}
                {!searchLoading &&
                  !searchError &&
                  visibleSearchResults.map((m, i) => (
                    <RelatedMoveRow
                      key={m.id}
                      move={m}
                      selected={false}
                      isNew
                      animationDelay={i * 30}
                      onToggle={() => setValue('relatedMoveIds', [...watchedRelatedMoveIds, m.id])}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(75,68,80,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1a1a1a',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#4b4450',
              fontFamily: 'var(--font-manrope)',
              flex: 1,
              minWidth: 0,
            }}
          >
            {error ? (
              <span
                style={{
                  color: '#f87171',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {error}
              </span>
            ) : watchedRelatedMoveIds.length > 0 ? (
              t('moves.fields.relatedLinked', { count: watchedRelatedMoveIds.length })
            ) : (
              t('moves.fields.relatedNoneLinked')
            )}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              style={{
                borderColor: 'rgba(75,68,80,0.4)',
                color: '#978e9b',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg,#dcb8ff,#8458b3,#dcb8ff)',
                backgroundSize: '200% 200%',
                backgroundPosition: 'left center',
                color: '#f8ebff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 4px 16px -2px rgba(132,88,179,0.4)',
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
