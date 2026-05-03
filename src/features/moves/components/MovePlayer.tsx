'use client';
import type { Difficulty, PoleType } from '@prisma/client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import type { LearnStatus } from '@/shared/types';
import type { LocalizedTag } from '@/shared/lib/localize';

import type { StepItem } from '../types';

import MoveBreakdown from './MoveBreakdown';
import MoveFavouriteButton from './MoveFavouriteButton';
import MoveHero from './MoveHero';
import { MoveProgressPicker } from './MoveProgressPicker';
import MoveSpecs from './MoveSpecs';
import MoveTabs from './MoveTabs';

const DIFFICULTY_BADGE: Record<Difficulty, { className: string; style?: CSSProperties }> = {
  BEGINNER: { className: 'bg-secondary-container text-on-secondary-container' },
  INTERMEDIATE: { className: 'bg-primary-container text-on-surface' },
  ADVANCED: { className: '', style: { backgroundColor: '#92400e', color: '#fef3c7' } },
};

function formatLabel(value: string) {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

type MovePlayerProps = {
  title: string;
  youtubeUrl: string;
  imageUrl: string | null;
  stepsData: StepItem[];
  difficulty: Difficulty;
  description: string | null;
  tags: LocalizedTag[];
  poleTypes: PoleType[];
  moveId: string;
  isFavourited: boolean;
  isAuthenticated: boolean;
  currentProgress: LearnStatus | null;
  gripType: string | null;
  entry: string | null;
  duration: string | null;
  coachNote: string | null;
  coachNoteAuthor: string | null;
};

export default function MovePlayer({
  title,
  youtubeUrl,
  imageUrl,
  stepsData,
  difficulty,
  description,
  tags,
  poleTypes,
  moveId,
  isFavourited,
  isAuthenticated,
  currentProgress,
  gripType,
  entry,
  duration,
  coachNote,
  coachNoteAuthor,
}: MovePlayerProps) {
  const [seekRequest, setSeekRequest] = useState<{ seconds: number } | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  function handleSeek(seconds: number) {
    const request = { seconds };
    if (window.scrollY === 0) {
      setSeekRequest(request);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // 400ms matches the browser's smooth-scroll animation duration
      scrollTimerRef.current = setTimeout(() => setSeekRequest(request), 400);
    }
  }

  const badge = DIFFICULTY_BADGE[difficulty];
  const difficultyLabel = formatLabel(difficulty);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8">
      {/* Hero grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: video player */}
        <MoveHero
          title={title}
          youtubeUrl={youtubeUrl}
          imageUrl={imageUrl}
          seekRequest={seekRequest ?? undefined}
        />

        {/* Right: info panel */}
        <div className="flex flex-col gap-5">
          {/* Difficulty chip */}
          <span
            aria-label={difficultyLabel}
            className={`w-fit rounded-full px-3 py-1 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase ${badge.className}`}
            style={badge.style}
          >
            {difficultyLabel}
          </span>

          {/* Title */}
          <h1 className="font-display text-[40px] leading-[0.95] font-semibold tracking-[-0.04em] text-on-surface lowercase sm:text-[52px] lg:text-[64px]">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="font-sans text-base leading-relaxed text-on-surface-variant">
              {description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`rounded-full px-3 py-1 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase ${
                    tag.color ? '' : 'border border-outline-variant/30 text-on-surface-variant'
                  }`}
                  style={
                    tag.color ? { backgroundColor: `${tag.color}28`, color: tag.color } : undefined
                  }
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3">
            <MoveFavouriteButton
              moveId={moveId}
              isFavourited={isFavourited}
              isAuthenticated={isAuthenticated}
            />
            {isAuthenticated ? (
              <div className="flex-1">
                <MoveProgressPicker moveId={moveId} initialStatus={currentProgress} />
              </div>
            ) : (
              <Link
                href="/login"
                className="h-full flex-1 rounded-lg border border-outline-variant/20 px-3 py-3 text-center font-sans text-xs font-semibold text-on-surface-variant transition-colors hover:border-outline-variant/40 hover:text-on-surface"
              >
                Log in to track progress
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Specs — full width below the grid */}
      <MoveSpecs gripType={gripType} entry={entry} duration={duration} poleTypes={poleTypes} />

      {/* Tabs — full width below specs */}
      <div className="mt-10">
        <MoveTabs
          breakdown={
            <MoveBreakdown
              stepsData={stepsData}
              onSeek={handleSeek}
              coachNote={coachNote}
              coachNoteAuthor={coachNoteAuthor}
            />
          }
        />
      </div>
    </div>
  );
}
