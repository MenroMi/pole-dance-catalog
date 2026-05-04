'use client';
import { ImageOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import type { LocalizedMoveWithTags } from '../types';

import MoveCardImage from './MoveCardImage';

function extractVideoId(youtubeUrl: string): string | null {
  const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const DIFFICULTY_BADGE: Record<string, { className: string; style?: React.CSSProperties }> = {
  BEGINNER: { className: 'bg-secondary-container text-on-secondary-container' },
  INTERMEDIATE: { className: 'bg-primary-container text-on-surface' },
  ADVANCED: { className: '', style: { backgroundColor: '#92400e', color: '#fef3c7' } },
};

type MoveCardProps = { move: LocalizedMoveWithTags };

export default function MoveCard({ move }: MoveCardProps) {
  const te = useTranslations('enums');
  const badge = DIFFICULTY_BADGE[move.difficulty] ?? DIFFICULTY_BADGE.BEGINNER;

  const imageSrc: string | null =
    move.imageUrl ??
    (() => {
      const videoId = extractVideoId(move.youtubeUrl);
      return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    })();

  const visibleTags = move.tags.slice(0, 3);

  return (
    <Link
      href={`/moves/${move.id}`}
      className="group block overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-accent">
        {imageSrc ? (
          <MoveCardImage src={imageSrc} alt={move.title} />
        ) : (
          <ImageOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <span
          className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
          style={badge.style}
        >
          {te(`difficulty.${move.difficulty}`)}
        </span>
        <h3 className="truncate font-display font-semibold text-on-surface">{move.title}</h3>
        {move.description && (
          <p className="line-clamp-2 font-sans text-sm text-on-surface-variant">
            {move.description}
          </p>
        )}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={
                  tag.color ? { backgroundColor: `${tag.color}28`, color: tag.color } : undefined
                }
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
