'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useOptimistic, useState, useTransition } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { cardVariants, tabContentVariants } from '@/shared/lib/motion';
import type { LearnStatus } from '@/shared/types';

import { removeProgressAction, updateProgressAction } from '../actions';
import type { ProgressWithMove } from '../types';

import ProgressCard from './ProgressCard';
import WantToLearnRow from './WantToLearnRow';

const DIFFICULTY_ORDER: Record<string, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

type Tab = 'in_progress' | 'want_to_learn' | 'learned';

const TAB_IDS: Tab[] = ['in_progress', 'want_to_learn', 'learned'];
const TAB_STATUS: Record<Tab, LearnStatus> = {
  in_progress: 'IN_PROGRESS',
  want_to_learn: 'WANT_TO_LEARN',
  learned: 'LEARNED',
};

type ProgressTrackerProps = {
  initialProgress: ProgressWithMove[];
  userName: string | null;
};

function EmptyTab({ tab }: { tab: Tab }) {
  const t = useTranslations('profile');

  if (tab === 'in_progress')
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant/40 px-6 py-20 text-center">
        <p
          className="font-display text-[22px] text-on-surface"
          style={{ letterSpacing: '-0.01em' }}
        >
          {t('emptyInProgress')}
        </p>
        <p className="mt-1.5 max-w-xs font-sans text-sm text-on-surface-variant">
          {t('emptyInProgressHint')}
        </p>
        <Link href="/catalog" className="mt-4 font-sans text-sm text-primary hover:underline">
          {t('browseCatalog')}
        </Link>
      </div>
    );

  if (tab === 'want_to_learn')
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant/40 px-6 py-20 text-center">
        <p
          className="font-display text-[22px] text-on-surface"
          style={{ letterSpacing: '-0.01em' }}
        >
          {t('emptyWantToLearn')}
        </p>
        <p className="mt-1.5 max-w-xs font-sans text-sm text-on-surface-variant">
          {t('emptyWantToLearnHint')}
        </p>
        <Link href="/catalog" className="mt-4 font-sans text-sm text-primary hover:underline">
          {t('browseCatalog')}
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant/40 px-6 py-20 text-center">
      <p className="font-display text-[22px] text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {t('emptyLearned')}
      </p>
      <p className="mt-1.5 max-w-xs font-sans text-sm text-on-surface-variant">
        {t('emptyLearnedHint')}
      </p>
    </div>
  );
}

export default function ProgressTracker({ initialProgress, userName }: ProgressTrackerProps) {
  const t = useTranslations('profile');
  const te = useTranslations('enums');
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('in_progress');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const [optimisticProgress, updateOptimistic] = useOptimistic(
    initialProgress,
    (state, action: { moveId: string; status: LearnStatus | null }) => {
      if (action.status === null) return state.filter((p) => p.moveId !== action.moveId);
      return state.map((p) =>
        p.moveId === action.moveId ? { ...p, status: action.status as LearnStatus } : p,
      );
    },
  );

  function handleStatusChange(moveId: string, status: LearnStatus | null) {
    startTransition(async () => {
      updateOptimistic({ moveId, status });
      try {
        if (status === null) await removeProgressAction(moveId);
        else await updateProgressAction(moveId, status);
      } finally {
        router.refresh();
      }
    });
  }

  const counts = useMemo(
    () => ({
      in_progress: optimisticProgress.filter((p) => p.status === 'IN_PROGRESS').length,
      want_to_learn: optimisticProgress.filter((p) => p.status === 'WANT_TO_LEARN').length,
      learned: optimisticProgress.filter((p) => p.status === 'LEARNED').length,
    }),
    [optimisticProgress],
  );

  const filtered = useMemo(() => {
    const byTab = optimisticProgress.filter((p) => p.status === TAB_STATUS[tab]);
    const searched = query
      ? byTab.filter((p) => p.move.title.toLowerCase().includes(query.toLowerCase()))
      : byTab;
    if (tab === 'want_to_learn') {
      return [...searched].sort(
        (a, b) =>
          (DIFFICULTY_ORDER[a.move.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.move.difficulty] ?? 0),
      );
    }
    return searched;
  }, [optimisticProgress, tab, query]);

  return (
    <div className="px-6 pb-24 md:px-12">
      {/* Breadcrumb */}
      <div className="mt-8 flex items-center gap-1.5 font-sans text-xs text-on-surface-variant">
        <Link
          href="/profile"
          className="text-on-surface-variant/80 transition-colors hover:text-on-surface"
        >
          {t('overview')}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50" />
        <span className="font-semibold tracking-[0.1em] text-primary uppercase">
          {t('progress')}
        </span>
      </div>

      {/* Page header */}
      <div className="mt-5 flex flex-col gap-8">
        <div>
          <p className="mb-3 font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
            {optimisticProgress.length} {t('tracked')}
            {userName ? ` · ${userName}` : ''}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-[-0.04em] text-on-surface lowercase md:text-[64px]">
            {t('journeyHeading')}{' '}
            <em className="font-medium text-primary italic not-italic">{t('journeyHighlight')}</em>
          </h1>
          <p className="mt-3.5 max-w-[460px] font-sans text-base leading-relaxed text-on-surface-variant">
            {t('journeySubtitle')}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-5">
          {/* Search */}
          <div className="relative w-[280px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              aria-label={t('searchMovesLabel')}
              placeholder={t('searchMovesPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/60 bg-transparent px-9 py-2.5 font-sans text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:border-primary/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('clearSearch')}
                className="absolute top-1/2 right-2 flex h-[22px] w-[22px] -translate-y-1/2 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-on-surface-variant/60 hover:text-on-surface"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tab picker */}
          <div
            role="tablist"
            className="inline-flex gap-0 rounded-lg border border-outline-variant/60 p-[3px]"
          >
            {TAB_IDS.map((id) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id);
                  setQuery('');
                }}
                className={`cursor-pointer rounded-md border-0 px-3 py-1.5 font-sans text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 ${
                  tab === id
                    ? 'bg-primary/14 text-primary'
                    : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {te(`learnStatus.${TAB_STATUS[id]}`)}{' '}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    tab === id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant/60'
                  }`}
                >
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-9">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AnimatePresence initial={false}>
              {filtered.length === 0 && !query && (
                <motion.div
                  key="empty"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <EmptyTab tab={tab} />
                </motion.div>
              )}
              {filtered.length === 0 && query && (
                <motion.div
                  key="no-match"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="py-20 text-center font-sans text-sm text-on-surface-variant">
                    {t('noSearchMatch', { query })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List container stays mounted so AnimatePresence can exit the last item */}
            <div className={tab === 'in_progress' ? 'flex flex-col gap-3' : 'flex flex-col gap-2'}>
              <AnimatePresence initial={false}>
                {filtered.map((item) => (
                  <motion.div
                    key={item.moveId}
                    layout="position"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit={
                      filtered.length === 1 ? { opacity: 0, transition: { duration: 0 } } : 'exit'
                    }
                  >
                    {tab === 'in_progress' ? (
                      <ProgressCard
                        item={item}
                        onStatusChange={handleStatusChange}
                        isPending={isPending}
                      />
                    ) : (
                      <WantToLearnRow
                        item={item}
                        onStatusChange={handleStatusChange}
                        isPending={isPending}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
