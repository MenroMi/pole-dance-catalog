'use client';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { extractVideoId } from '../lib/youtube';

type Phase = 'idle' | 'transitioning' | 'playing';

type MoveHeroProps = {
  title: string;
  youtubeUrl: string;
  imageUrl: string | null;
  seekRequest?: { seconds: number };
};

// YouTube returns a 120x90 "Unavailable" thumbnail (HTTP 200) for non-existent IDs
const YOUTUBE_PLACEHOLDER_MAX_WIDTH = 120;

export default function MoveHero({ title, youtubeUrl, imageUrl, seekRequest }: MoveHeroProps) {
  const t = useTranslations('moves');
  const [phase, setPhase] = useState<Phase>('idle');
  const [startAt, setStartAt] = useState<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const videoId = extractVideoId(youtubeUrl);
  const thumbnail =
    imageUrl ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  // If the thumbnail is derived from YouTube and failed, the video is likely unavailable too
  const hasVideo = !!videoId && !thumbnailFailed;

  // Keep phaseRef in sync so the seek effect always reads current phase
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handle seek requests — object reference changes on every seek, even to the same timestamp
  useEffect(() => {
    if (seekRequest == null || !hasVideo) return;
    const { seconds } = seekRequest;
    const currentPhase = phaseRef.current;
    if (currentPhase === 'playing') {
      setStartAt(seconds);
      setIframeKey((k) => k + 1);
    } else if (currentPhase === 'idle') {
      setStartAt(seconds);
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: responding to external prop, not deriving state from state
        setPhase('playing');
      } else {
        setPhase('transitioning');
        timeoutRef.current = setTimeout(() => setPhase('playing'), 500);
      }
    }
    // 'transitioning': ignore — animation already in progress
  }, [seekRequest, hasVideo]);

  function handlePlay() {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setPhase('playing');
    } else {
      setPhase('transitioning');
      timeoutRef.current = setTimeout(() => setPhase('playing'), 500);
    }
  }

  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1${startAt != null ? `&start=${startAt}` : ''}`;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-gradient-to-br from-[#0a0a0a] via-[#1f1f1f] to-[#2b1545]">
      {/* Radial violet glow — visible through thumbnail and on fallback */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(220,184,255,0.18), transparent 55%)',
        }}
      />

      {/* Thumbnail — zooms, blurs and fades during transitioning */}
      {phase !== 'playing' &&
        (thumbnail && !thumbnailFailed ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            priority
            className={`object-cover transition-all duration-500 ${
              phase === 'transitioning'
                ? 'scale-110 opacity-0 blur-sm'
                : 'scale-100 opacity-80 blur-none'
            }`}
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth <= YOUTUBE_PLACEHOLDER_MAX_WIDTH)
                setThumbnailFailed(true);
            }}
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-surface-container" />
        ))}

      {/* iframe — mounts during transitioning (opacity-0), fades in, stays for playing */}
      {phase !== 'idle' && hasVideo && (
        <iframe
          key={iframeKey}
          src={iframeSrc}
          title={title}
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
            phase === 'transitioning' ? 'opacity-0' : 'opacity-100'
          }`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      )}

      {/* Play button — visible only in idle */}
      {phase === 'idle' && hasVideo && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={t('playMove', { title })}
          className="group absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface/70 text-primary shadow-[0_0_32px_rgba(220,184,255,0.06)] backdrop-blur-md transition-transform group-hover:scale-105">
            <Play size={36} fill="currentColor" aria-hidden="true" />
          </div>
        </button>
      )}
    </div>
  );
}
