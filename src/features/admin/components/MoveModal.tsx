'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import {
  createMoveAction,
  getMovesListAction,
  updateMoveAction,
  uploadMoveImageAction,
} from '../actions';
import type { AdminTagRow, CreateMoveInput, FullAdminMove } from '../types';

let _allMovesCache: { id: string; title_en: string; title_pl: string }[] | null = null;

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

function jsonToText(value: unknown): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
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

interface FormState {
  title_en: string;
  description_en: string;
  youtubeUrl: string;
  stepsData_en: string;
  gripType_en: string;
  entry_en: string;
  coachNote_en: string;
  title_pl: string;
  description_pl: string;
  stepsData_pl: string;
  gripType_pl: string;
  entry_pl: string;
  coachNote_pl: string;
  difficulty: (typeof DIFFICULTIES)[number];
  category: (typeof CATEGORIES)[number];
  poleTypes: string[];
  imageUrl: string;
  duration: string;
  coachNoteAuthor: string;
  tagIds: string[];
  relatedMoveIds: string[];
}

function initForm(move: FullAdminMove | null): FormState {
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

function ImageDropZone({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const t = useTranslations('admin');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(t('moves.fields.imageOnlyImages'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('moves.fields.imageMaxSize'));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadMoveImageAction(fd);
      onChange(res.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid rgba(75,68,80,0.3)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        />
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(75,68,80,0.5)',
            borderRadius: 6,
            padding: '5px 12px',
            color: '#e2e2e2',
            fontFamily: 'var(--font-manrope)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('moves.fields.imageChange')}
        </button>
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
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? 'rgba(220,184,255,0.6)' : 'rgba(75,68,80,0.4)'}`,
          borderRadius: 8,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? 'rgba(220,184,255,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'all 150ms',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
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
          {uploading ? t('moves.fields.imageUploading') : t('moves.fields.imageDrop')}
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

export function MoveModal({ move, availableTags, onClose, onSaved }: MoveModalProps) {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<Tab>('en');
  const [form, setForm] = useState<FormState>(() => initForm(move));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepsEnError, setStepsEnError] = useState(false);
  const [stepsPlError, setStepsPlError] = useState(false);
  const [allMoves, setAllMoves] = useState<{ id: string; title_en: string; title_pl: string }[]>(
    () => _allMovesCache ?? [],
  );
  const [relatedQuery, setRelatedQuery] = useState('');

  useEffect(() => {
    if (_allMovesCache) return;
    getMovesListAction()
      .then((moves) => {
        _allMovesCache = moves;
        setAllMoves(moves);
      })
      .catch(console.error);
  }, []);

  function set(field: keyof FormState, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function togglePoleType(pt: string) {
    setForm((prev) => ({
      ...prev,
      poleTypes: prev.poleTypes.includes(pt)
        ? prev.poleTypes.filter((p) => p !== pt)
        : [...prev.poleTypes, pt],
    }));
  }

  function toggleTagId(id: string) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter((t) => t !== id) : [...prev.tagIds, id],
    }));
  }

  function toggleRelatedMoveId(id: string) {
    setForm((prev) => ({
      ...prev,
      relatedMoveIds: prev.relatedMoveIds.includes(id)
        ? prev.relatedMoveIds.filter((r) => r !== id)
        : [...prev.relatedMoveIds, id],
    }));
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setStepsEnError(false);
    setStepsPlError(false);
  }

  async function handleSave() {
    if (form.stepsData_en.trim()) {
      try {
        JSON.parse(form.stepsData_en);
      } catch {
        setStepsEnError(true);
        handleTabChange('en');
        return;
      }
    }
    if (form.stepsData_pl.trim()) {
      try {
        JSON.parse(form.stepsData_pl);
      } catch {
        setStepsPlError(true);
        handleTabChange('pl');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const input: CreateMoveInput = {
        title_en: form.title_en,
        title_pl: form.title_pl,
        description_en: form.description_en || undefined,
        description_pl: form.description_pl || undefined,
        difficulty: form.difficulty,
        category: form.category,
        poleTypes: form.poleTypes as CreateMoveInput['poleTypes'],
        youtubeUrl: form.youtubeUrl,
        imageUrl: form.imageUrl || undefined,
        gripType_en: form.gripType_en || undefined,
        gripType_pl: form.gripType_pl || undefined,
        entry_en: form.entry_en || undefined,
        entry_pl: form.entry_pl || undefined,
        duration: form.duration || undefined,
        coachNote_en: form.coachNote_en || undefined,
        coachNote_pl: form.coachNote_pl || undefined,
        coachNoteAuthor: form.coachNoteAuthor || undefined,
        stepsData_en: textToSteps(form.stepsData_en),
        stepsData_pl: textToSteps(form.stepsData_pl),
        tagIds: form.tagIds,
        relatedMoveIds: form.relatedMoveIds,
      };
      if (move) {
        await updateMoveAction({ ...input, id: move.id });
      } else {
        await createMoveAction(input);
      }
      _allMovesCache = null;
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'en', label: t('moves.tabs.en') },
    { key: 'pl', label: t('moves.tabs.pl') },
    { key: 'meta', label: t('moves.tabs.meta') },
    { key: 'related', label: t('moves.tabs.related') },
  ];

  const filteredMoves = allMoves.filter(
    (m) =>
      m.id !== move?.id &&
      (relatedQuery === '' ||
        m.title_en.toLowerCase().includes(relatedQuery.toLowerCase()) ||
        m.title_pl.toLowerCase().includes(relatedQuery.toLowerCase())),
  );

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
        if (e.target === e.currentTarget) onClose();
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
          overflowX: 'auto',
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
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
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
              onClick={() => handleTabChange(key)}
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
              }}
            >
              {label}
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
                  value={form.title_en}
                  onChange={(e) => set('title_en', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.titleEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.descriptionEn')}</label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => set('description_en', e.target.value)}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder={t('moves.fields.optionalDescription')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.gripTypeEn')}</label>
                <Input
                  value={form.gripType_en}
                  onChange={(e) => set('gripType_en', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.gripTypeEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.entryEn')}</label>
                <Input
                  value={form.entry_en}
                  onChange={(e) => set('entry_en', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.entryEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNoteEn')}</label>
                <textarea
                  value={form.coachNote_en}
                  onChange={(e) => set('coachNote_en', e.target.value)}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                  placeholder={t('moves.fields.coachNoteEnPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.stepsEn')}</label>
                <textarea
                  value={form.stepsData_en}
                  onChange={(e) => {
                    set('stepsData_en', e.target.value);
                    setStepsEnError(false);
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v) {
                      try {
                        JSON.parse(v);
                        setStepsEnError(false);
                      } catch {
                        setStepsEnError(true);
                      }
                    }
                  }}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                    borderColor: stepsEnError ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"text": "Start", "timestamp": 0}\n]'}
                />
                {stepsEnError && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t('invalidJson')}
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
                  value={form.title_pl}
                  onChange={(e) => set('title_pl', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.titlePlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.descriptionPl')}</label>
                <textarea
                  value={form.description_pl}
                  onChange={(e) => set('description_pl', e.target.value)}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder={t('moves.fields.optionalDescription')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.gripTypePl')}</label>
                <Input
                  value={form.gripType_pl}
                  onChange={(e) => set('gripType_pl', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.gripTypePlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.entryPl')}</label>
                <Input
                  value={form.entry_pl}
                  onChange={(e) => set('entry_pl', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.entryPlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNotePl')}</label>
                <textarea
                  value={form.coachNote_pl}
                  onChange={(e) => set('coachNote_pl', e.target.value)}
                  className="admin-field"
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                  placeholder={t('moves.fields.coachNotePlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.stepsPl')}</label>
                <textarea
                  value={form.stepsData_pl}
                  onChange={(e) => {
                    set('stepsData_pl', e.target.value);
                    setStepsPlError(false);
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v) {
                      try {
                        JSON.parse(v);
                        setStepsPlError(false);
                      } catch {
                        setStepsPlError(true);
                      }
                    }
                  }}
                  className="admin-field"
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                    borderColor: stepsPlError ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"text": "Start", "timestamp": 0}\n]'}
                />
                {stepsPlError && (
                  <span style={{ color: '#f87171', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {t('invalidJson')}
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
                  value={form.youtubeUrl}
                  onChange={(e) => set('youtubeUrl', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.youtubeUrlPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.difficulty')} *</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => set('difficulty', e.target.value)}
                  style={{ ...fieldStyle, cursor: 'pointer' }}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d} style={{ background: '#1a1a1a' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.category')} *</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  style={{ ...fieldStyle, cursor: 'pointer' }}
                >
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
                        checked={form.poleTypes.includes(pt)}
                        onChange={() => togglePoleType(pt)}
                      />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.imageUrl')}</label>
                <ImageDropZone value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.duration')}</label>
                <Input
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.durationPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.coachNoteAuthor')}</label>
                <Input
                  value={form.coachNoteAuthor}
                  onChange={(e) => set('coachNoteAuthor', e.target.value)}
                  className="admin-field"
                  style={fieldStyle}
                  placeholder={t('moves.fields.coachNoteAuthorPlaceholder')}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>{t('moves.fields.tags')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagId(tag.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        border: `1px solid ${form.tagIds.includes(tag.id) ? '#dcb8ff' : 'rgba(255,255,255,0.15)'}`,
                        background: form.tagIds.includes(tag.id)
                          ? 'rgba(220,184,255,0.15)'
                          : 'transparent',
                        color: form.tagIds.includes(tag.id) ? '#dcb8ff' : '#888',
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 150ms',
                      }}
                    >
                      {tag.name_en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'related' && (
            <>
              <div
                style={{
                  position: 'sticky',
                  padding: '12px 24px',
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
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginTop: 8,
                  padding: '0 24px 12px 24px',
                }}
              >
                {filteredMoves.length === 0 && (
                  <span
                    style={{ color: '#6b6270', fontSize: 13, fontFamily: 'var(--font-manrope)' }}
                  >
                    {t('moves.fields.relatedNoResults')}
                  </span>
                )}
                {filteredMoves.map((m) => {
                  const selected = form.relatedMoveIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleRelatedMoveId(m.id)}
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
                        <div
                          style={{
                            color: '#6b6270',
                            fontSize: 12,
                            fontFamily: 'var(--font-manrope)',
                          }}
                        >
                          {m.title_pl}
                        </div>
                      </div>
                    </button>
                  );
                })}
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
          {error && <span style={{ color: '#f87171', fontSize: 14 }}>{error}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
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
              onClick={handleSave}
              disabled={
                saving ||
                !form.title_en ||
                !form.title_pl ||
                !form.youtubeUrl ||
                stepsEnError ||
                stepsPlError
              }
              style={{ background: '#8458b3', color: '#fff' }}
            >
              {saving ? t('moves.saving') : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
