'use client';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

import { cardVariants } from '@/shared/lib/motion';
import type { Locale } from '@/i18n/routing';

import { getMovesAction } from '../actions';
import type { MoveFilters } from '@/shared/types';
import type { LocalizedMoveWithTags } from '../types';

import MoveCard from './MoveCard';

const PAGE_SIZE = 12;

type MoveGridProps = {
  initialMoves: LocalizedMoveWithTags[];
  initialHasMore: boolean;
  totalCount: number;
  filters: MoveFilters;
  locale: Locale;
};

export default function MoveGrid({
  initialMoves,
  initialHasMore,
  totalCount,
  filters,
  locale,
}: MoveGridProps) {
  const [moves, setMoves] = useState(initialMoves);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const pageRef = useRef(1);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let cancelled = false;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || isLoadingRef.current) return;

      isLoadingRef.current = true;
      setLoading(true);

      try {
        const nextPage = pageRef.current + 1;
        const result = await getMovesAction({ ...filters, page: nextPage, pageSize: PAGE_SIZE }, locale);

        if (cancelled) return;

        pageRef.current = nextPage;
        setMoves((prev) => [...prev, ...result.items]);
        setHasMore(result.items.length >= PAGE_SIZE);
      } finally {
        if (!cancelled) {
          isLoadingRef.current = false;
          setLoading(false);
        }
      }
    });

    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
    // filters is stable for this component's lifetime — parent remounts via `key` prop when filters change
  }, [hasMore]); // eslint-disable-line react-hooks/exhaustive-deps

  const header = (
    <div className="mb-8">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-on-surface-variant uppercase">
        Catalog · {totalCount} moves
      </p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface lowercase md:text-5xl">
        Every move, <em className="font-medium text-primary not-italic">indexed.</em>
      </h1>
    </div>
  );

  if (moves.length === 0) {
    return (
      <div className="flex h-full flex-col p-6">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-on-surface-variant">No moves match these filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {header}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {moves.map((move) => (
          <motion.div key={move.id} variants={cardVariants} initial="initial" animate="animate">
            <MoveCard move={move} />
          </motion.div>
        ))}
      </div>
      {loading && (
        <div className="flex justify-center py-8" data-testid="loading-spinner">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {hasMore && <div ref={sentinelRef} data-testid="sentinel" />}
    </div>
  );
}
