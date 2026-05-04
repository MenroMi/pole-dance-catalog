'use client';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';

import { extractVideoId } from '@/features/moves/lib/youtube';

import type { FavouriteWithMove } from '../types';

type ProfileFavouritesPreviewProps = {
  favourites: FavouriteWithMove[];
};

function ThumbImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120) setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}

function ThumbPlaceholder({ title }: { title: string }) {
  const glyph = title.charAt(0).toUpperCase();
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#0e0e0e,#2a2a2a)' }}
    >
      <span className="font-display text-4xl font-semibold text-primary/40">{glyph}</span>
    </div>
  );
}

export default function ProfileFavouritesPreview({ favourites }: ProfileFavouritesPreviewProps) {
  return (
    <div className="flex-1 rounded-xl border border-outline-variant/20 bg-surface-container p-6">
      <div className="mb-[18px] flex items-baseline justify-between">
        <span className="font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
          Favourites
        </span>
        <Link
          href="/profile/favourite-moves"
          className="font-sans text-xs text-primary/80 transition-colors hover:text-primary"
        >
          View all →
        </Link>
      </div>

      {favourites.length === 0 ? (
        <p className="font-sans text-sm text-on-surface-variant">
          No favourites yet.{' '}
          <Link href="/catalog" className="text-primary hover:underline">
            Browse the catalog →
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {favourites.map((fav) => {
            const videoId = extractVideoId(fav.move.youtubeUrl);
            const thumb =
              fav.move.imageUrl ??
              (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
            return (
              <Link
                key={fav.id}
                href={`/moves/${fav.moveId}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-outline-variant/10"
              >
                {thumb ? (
                  <ThumbImage src={thumb} alt={fav.move.title} />
                ) : (
                  <ThumbPlaceholder title={fav.move.title} />
                )}
                <div
                  className="absolute inset-x-0 bottom-0 px-2 py-1.5 font-sans text-[9px] font-semibold text-white"
                  style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))' }}
                >
                  {fav.move.title.toLowerCase()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
