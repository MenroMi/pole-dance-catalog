'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { createMoveAction, updateMoveAction } from '../actions';
import type { AdminTagRow, CreateMoveInput, FullAdminMove } from '../types';

interface MoveModalProps {
  move: FullAdminMove | null;
  availableTags: AdminTagRow[];
  onClose: () => void;
  onSaved: () => void;
}

type Tab = 'en' | 'pl' | 'meta';

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

function textToSteps(text: string): { time: number; label: string }[] {
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is { time: number; label: string } =>
        typeof s === 'object' && typeof s.time === 'number' && typeof s.label === 'string',
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
  };
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
  fontSize: 12,
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

  async function handleSave() {
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
      };
      if (move) {
        await updateMoveAction({ ...input, id: move.id });
      } else {
        await createMoveAction(input);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setTab('en');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'en', label: t('moves.tabs.en') },
    { key: 'pl', label: t('moves.tabs.pl') },
    { key: 'meta', label: t('moves.tabs.meta') },
  ];

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
          maxHeight: '90vh',
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
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {tab === 'en' && (
            <div>
              <div style={rowStyle}>
                <label style={labelStyle}>Title (EN) *</label>
                <Input
                  value={form.title_en}
                  onChange={(e) => set('title_en', e.target.value)}
                  style={fieldStyle}
                  placeholder="e.g. Butterfly"
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Description (EN)</label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => set('description_en', e.target.value)}
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="Optional description"
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>YouTube URL *</label>
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => set('youtubeUrl', e.target.value)}
                  style={fieldStyle}
                  placeholder="https://youtu.be/..."
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Grip Type (EN)</label>
                <Input
                  value={form.gripType_en}
                  onChange={(e) => set('gripType_en', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Entry (EN)</label>
                <Input
                  value={form.entry_en}
                  onChange={(e) => set('entry_en', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Coach Note (EN)</label>
                <textarea
                  value={form.coachNote_en}
                  onChange={(e) => set('coachNote_en', e.target.value)}
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>
                  Steps Data (EN) — JSON array of {`{ time, label }`}
                </label>
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
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    resize: 'vertical',
                    borderColor: stepsEnError ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"time": 0, "label": "Start"}\n]'}
                />
                {stepsEnError && (
                  <span style={{ color: '#f87171', fontSize: 12, marginTop: 4, display: 'block' }}>
                    Invalid JSON
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'pl' && (
            <div>
              <div style={rowStyle}>
                <label style={labelStyle}>Tytuł (PL) *</label>
                <Input
                  value={form.title_pl}
                  onChange={(e) => set('title_pl', e.target.value)}
                  style={fieldStyle}
                  placeholder="np. Motyl"
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Opis (PL)</label>
                <textarea
                  value={form.description_pl}
                  onChange={(e) => set('description_pl', e.target.value)}
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Chwyt (PL)</label>
                <Input
                  value={form.gripType_pl}
                  onChange={(e) => set('gripType_pl', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Wejście (PL)</label>
                <Input
                  value={form.entry_pl}
                  onChange={(e) => set('entry_pl', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Notatka trenera (PL)</label>
                <textarea
                  value={form.coachNote_pl}
                  onChange={(e) => set('coachNote_pl', e.target.value)}
                  style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Kroki (PL) — JSON array of {`{ time, label }`}</label>
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
                  style={{
                    ...fieldStyle,
                    minHeight: 80,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    resize: 'vertical',
                    borderColor: stepsPlError ? '#f87171' : 'rgba(255,255,255,0.1)',
                  }}
                  placeholder={'[\n  {"time": 0, "label": "Start"}\n]'}
                />
                {stepsPlError && (
                  <span style={{ color: '#f87171', fontSize: 12, marginTop: 4, display: 'block' }}>
                    Invalid JSON
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div>
              <div style={rowStyle}>
                <label style={labelStyle}>Difficulty *</label>
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
                <label style={labelStyle}>Category *</label>
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
                <label style={labelStyle}>Pole Types</label>
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
                <label style={labelStyle}>Image URL</label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  style={fieldStyle}
                  placeholder="https://..."
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Duration</label>
                <Input
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  style={fieldStyle}
                  placeholder="e.g. 30s"
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Coach Note Author</label>
                <Input
                  value={form.coachNoteAuthor}
                  onChange={(e) => set('coachNoteAuthor', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Tags</label>
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
                        fontSize: 13,
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
          {error && <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>}
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
              disabled={saving || !form.title_en || !form.title_pl || !form.youtubeUrl}
              style={{ background: '#8458b3', color: '#fff' }}
            >
              {saving ? 'Saving...' : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
