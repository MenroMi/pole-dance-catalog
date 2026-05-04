import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

import type { ProgressWithMove } from '../types';

type ProgressWithTags = ProgressWithMove & { move: { tags: { id: string; name: string }[] } };

type ProfileCurrentlyLearningProps = {
  moves: ProgressWithTags[];
};

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: '#84d099',
  INTERMEDIATE: '#dcb8ff',
  ADVANCED: '#f59e0b',
};

function DifficultyChip({ label, difficulty }: { label: string; difficulty: string }) {
  const color = DIFFICULTY_COLOR[difficulty] ?? DIFFICULTY_COLOR.BEGINNER;
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 font-sans text-[9px] font-bold tracking-[0.14em] uppercase"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

export default async function ProfileCurrentlyLearning({ moves }: ProfileCurrentlyLearningProps) {
  const t = await getTranslations('profile');
  const te = await getTranslations('enums');

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container p-6">
      <div className="mb-[18px] flex shrink-0 items-baseline justify-between">
        <span className="font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
          {t('currentlyLearning')}
        </span>
        <span className="font-sans text-[11px] text-on-surface-variant/70">
          {moves.length} {t('movesCount', { count: moves.length })}
        </span>
      </div>

      {moves.length === 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="font-sans text-sm text-on-surface-variant">{t('emptyInProgress')}</p>
          <Link href="/catalog" className="font-sans text-sm text-primary hover:underline">
            {t('browseCatalog')}
          </Link>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {moves.map((p) => {
            const tagLine = p.move.tags
              .slice(0, 2)
              .map((tag) => tag.name)
              .join(' · ');
            return (
              <Link
                key={p.id}
                href={`/moves/${p.moveId}`}
                className="group flex items-center gap-3.5 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-primary/[0.06]"
              >
                {/* Thumbnail */}
                <div
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md"
                  style={{ background: 'linear-gradient(135deg,#0e0e0e,#2a2a2a)' }}
                >
                  {p.move.imageUrl ? (
                    <Image src={p.move.imageUrl} alt={p.move.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-primary/40">
                      {p.move.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Title + tags */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-display text-sm font-medium text-on-surface group-hover:text-primary">
                    {p.move.title}
                  </span>
                  {tagLine && (
                    <span className="font-sans text-[11px] text-on-surface-variant/70">
                      {tagLine}
                    </span>
                  )}
                </div>

                <DifficultyChip
                  label={te(`difficulty.${p.move.difficulty}`)}
                  difficulty={p.move.difficulty}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
