'use client';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { StepItem } from '../types';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MoveBreakdown({
  stepsData,
  onSeek,
  coachNote,
  coachNoteAuthor,
}: {
  stepsData: StepItem[];
  onSeek: (seconds: number) => void;
  coachNote: string | null;
  coachNoteAuthor: string | null;
}) {
  const t = useTranslations('moves');

  if (stepsData.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface-low p-8">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {stepsData.map((step, index) => (
            <div
              key={index}
              className="group -mx-4 flex gap-6 rounded-lg p-4 transition-colors hover:bg-surface-highest"
            >
              <div className="shrink-0 font-display text-4xl font-bold text-outline-variant opacity-50 transition-colors group-hover:text-primary group-hover:opacity-100">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <p className="font-sans leading-relaxed text-on-surface">{step.text}</p>
                {step.timestamp != null && (
                  <button
                    type="button"
                    onClick={() => onSeek(step.timestamp!)}
                    aria-label={`Seek to ${formatTimestamp(step.timestamp)}`}
                    className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-2 py-1 font-sans text-xs text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
                  >
                    <Play size={10} fill="currentColor" aria-hidden="true" />
                    {formatTimestamp(step.timestamp)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {coachNote && (
          <aside className="hidden self-start rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 lg:block">
            <p
              data-testid="coach-note-label"
              className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-primary uppercase"
            >
              {t('coachNote')}
            </p>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              &ldquo;{coachNote}&rdquo;
            </p>
            {coachNoteAuthor && (
              <p className="mt-3 text-[11px] text-outline">— {coachNoteAuthor}</p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
