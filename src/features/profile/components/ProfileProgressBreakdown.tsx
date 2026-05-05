import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

type ProfileProgressBreakdownProps = {
  learned: number;
  inProgress: number;
  wantToLearn: number;
};

const ROWS = [
  { key: 'learned', status: 'LEARNED', color: '#84d099' },
  { key: 'inProgress', status: 'IN_PROGRESS', color: '#dcb8ff' },
  { key: 'wantToLearn', status: 'WANT_TO_LEARN', color: '#978e9b' },
] as const;

export default async function ProfileProgressBreakdown({
  learned,
  inProgress,
  wantToLearn,
}: ProfileProgressBreakdownProps) {
  const t = await getTranslations('profile');
  const te = await getTranslations('enums');
  const counts: Record<string, number> = { learned, inProgress, wantToLearn };
  const total = learned + inProgress + wantToLearn;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
      <div className="mb-[18px] flex items-baseline justify-between">
        <span className="font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
          {t('progress')}
        </span>
        <Link
          href="/profile/progress"
          className="font-sans text-xs text-primary/80 transition-colors hover:text-primary"
        >
          {t('viewAll')}
        </Link>
      </div>

      {/* Stacked bar */}
      <div
        className="mb-5 flex h-1.5 overflow-hidden rounded-full"
        style={{ background: 'rgba(75,68,80,0.3)' }}
        aria-hidden="true"
      >
        {total > 0 &&
          ROWS.map(({ key, color }) => (
            <div
              key={key}
              style={{
                width: `${(counts[key] / total) * 100}%`,
                background: color,
                transition: 'width 400ms',
              }}
            />
          ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        {ROWS.map(({ key, status, color }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-sans text-[13px] text-on-surface-variant">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden="true"
              />
              {te(`learnStatus.${status}`)}
            </span>
            <span className="font-display text-lg font-medium text-on-surface">{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
