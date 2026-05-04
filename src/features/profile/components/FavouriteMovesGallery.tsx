'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Heart, Search, X } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useCallback, useMemo, useOptimistic, useState, useTransition } from 'react';

import { extractVideoId } from '@/features/moves/lib/youtube';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { cardVariants } from '@/shared/lib/motion';

import { removeFavouriteAction } from '../actions';
import type { FavouriteWithMove } from '../types';

const DIFFICULTY_BADGE: Record<string, { className: string; style?: React.CSSProperties }> = {
  BEGINNER: { className: 'bg-secondary-container text-on-secondary-container' },
  INTERMEDIATE: { className: 'bg-primary-container text-on-surface' },
  ADVANCED: { className: '', style: { backgroundColor: '#92400e', color: '#fef3c7' } },
};

const DIFFICULTY_ORDER: Record<string, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

type SortKey = 'recent' | 'name' | 'level';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MovePlaceholder() {
  return (
    <div className="to-surface-container-highest flex h-full w-full items-center justify-center bg-linear-to-br from-surface-container">
      <span className="text-5xl opacity-20 select-none">⋮</span>
    </div>
  );
}

const YOUTUBE_PLACEHOLDER_MAX_WIDTH = 120;

function FavouriteCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MovePlaceholder />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= YOUTUBE_PLACEHOLDER_MAX_WIDTH) setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}

function RemoveButton({
  onClick,
  label,
  disabled,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      aria-label={label}
      className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-primary/25 bg-surface/50 backdrop-blur-md transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
      style={
        hovered
          ? {
              background: 'rgba(255,143,143,0.18)',
              borderColor: 'rgba(255,159,159,0.35)',
              color: '#ff9f9f',
            }
          : { color: '#dcb8ff' }
      }
    >
      <Heart className="h-[15px] w-[15px]" fill="currentColor" strokeWidth={0} />
    </button>
  );
}

function FavouriteCard({
  fav,
  onRemove,
  isPending,
}: {
  fav: FavouriteWithMove;
  onRemove: (fav: FavouriteWithMove) => void;
  isPending: boolean;
}) {
  const badge = DIFFICULTY_BADGE[fav.move.difficulty] ?? DIFFICULTY_BADGE.BEGINNER;
  const videoId = extractVideoId(fav.move.youtubeUrl);
  const thumb =
    fav.move.imageUrl ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  const poleLabel =
    fav.move.poleTypes.length === 2
      ? 'Static & Spin'
      : fav.move.poleTypes[0]
        ? fav.move.poleTypes[0].charAt(0) + fav.move.poleTypes[0].slice(1).toLowerCase()
        : null;
  const firstTag = fav.move.tags[0]?.name ?? null;
  const techStrip = [poleLabel, firstTag].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/moves/${fav.moveId}`}
      className="group relative block overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container transition-all duration-240 hover:-translate-y-[3px] hover:border-primary/35"
    >
      {/* 4:5 portrait image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {thumb ? <FavouriteCardImage src={thumb} alt={fav.move.title} /> : <MovePlaceholder />}

        {/* Top overlay: difficulty chip + remove button */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-linear-to-b from-surface/70 to-transparent p-3.5">
          <span
            className={`pointer-events-auto rounded-full px-3 py-1 font-sans text-[10px] font-bold tracking-[0.16em] uppercase ${badge.className}`}
            style={badge.style}
          >
            {fav.move.difficulty.charAt(0) + fav.move.difficulty.slice(1).toLowerCase()}
          </span>
          <div className="pointer-events-auto">
            <RemoveButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(fav);
              }}
              label={`Remove ${fav.move.title} from favourites`}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Bottom technical strip */}
        {techStrip && (
          <div className="absolute bottom-3 left-3.5 font-sans text-[9px] font-semibold tracking-[0.18em] text-primary/70 uppercase">
            {techStrip}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-display text-xl font-semibold tracking-tight text-on-surface lowercase">
          {fav.move.title.toLowerCase()}
        </h3>
        {fav.move.description && (
          <p className="line-clamp-2 font-sans text-[13px] leading-[1.45] text-on-surface-variant">
            {fav.move.description}
          </p>
        )}
        <span className="mt-1.5 font-sans text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
          Added {formatDate(fav.createdAt)}
        </span>
      </div>
    </Link>
  );
}

function SortPicker({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const opts: { id: SortKey; label: string }[] = [
    { id: 'recent', label: 'Recent' },
    { id: 'name', label: 'A–Z' },
    { id: 'level', label: 'Level' },
  ];
  return (
    <div className="inline-flex gap-0 rounded-lg border border-outline-variant/60 p-[3px]">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`cursor-pointer rounded-md border-0 px-3 py-1.5 font-sans text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
            value === o.id
              ? 'bg-primary/14 text-primary'
              : 'bg-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function FavouriteMovesGallery({
  initialFavourites,
  userName,
}: {
  initialFavourites: FavouriteWithMove[];
  userName: string | null;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmFav, setConfirmFav] = useState<FavouriteWithMove | null>(null);
  const [removeError, setRemoveError] = useState(false);
  const [optimisticFavs, removeOptimistic] = useOptimistic(
    initialFavourites,
    (state, moveId: string) => state.filter((f) => f.moveId !== moveId),
  );
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const list = query
      ? optimisticFavs.filter((f) => f.move.title.toLowerCase().includes(query.toLowerCase()))
      : [...optimisticFavs];

    if (sort === 'name') {
      list.sort((a, b) => a.move.title.localeCompare(b.move.title));
    } else if (sort === 'level') {
      list.sort(
        (a, b) =>
          (DIFFICULTY_ORDER[a.move.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.move.difficulty] ?? 0),
      );
    }
    // 'recent' is already ordered by createdAt desc from the server
    return list;
  }, [optimisticFavs, query, sort]);

  function handleRemove(moveId: string) {
    setRemoveError(false);
    startTransition(async () => {
      removeOptimistic(moveId);
      try {
        await removeFavouriteAction(moveId);
      } catch {
        setRemoveError(true);
      }
    });
  }

  const handleOpenRemoveDialog = useCallback((fav: FavouriteWithMove) => {
    setConfirmFav(fav);
    setDialogOpen(true);
  }, []);

  return (
    <>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent
          onCloseAutoFocus={() => {
            setConfirmFav(null);
            setRemoveError(false);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from favourites?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-on-surface">{confirmFav?.move.title}</strong> will be removed
              from your saved performances. You can add it back any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmFav) handleRemove(confirmFav.moveId);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="px-6 pb-24 md:px-12">
        {removeError && (
          <p
            role="alert"
            className="bg-error-container text-on-error-container mt-4 rounded-lg px-4 py-3 text-center text-sm"
          >
            Something went wrong. Please try again.
          </p>
        )}

        {/* Breadcrumb */}
        <div className="mt-8 flex items-center gap-1.5 font-sans text-xs text-on-surface-variant">
          <Link
            href="/profile"
            className="text-on-surface-variant/80 transition-colors hover:text-on-surface"
          >
            Profile
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-semibold tracking-[0.1em] text-primary uppercase">Saved</span>
        </div>

        {/* Page header */}
        <div className="mt-5 flex flex-col gap-8 pb-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
                {optimisticFavs.length} saved{userName ? ` · ${userName}` : ''}
              </p>
              <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-[-0.04em] text-on-surface lowercase md:text-[64px]">
                saved <em className="font-medium text-primary italic not-italic">performances</em>
              </h1>
              <p className="mt-3.5 max-w-[460px] font-sans text-base leading-relaxed text-on-surface-variant">
                Your curated gallery — moves you keep coming back to.
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-5">
            {/* Search */}
            <div className="relative w-[280px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                aria-label="Search favourites"
                placeholder="Search favourites..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/60 bg-transparent px-9 py-2.5 font-sans text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:border-primary/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex h-[22px] w-[22px] -translate-y-1/2 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3.5">
              <span className="font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
                Sort
              </span>
              <SortPicker value={sort} onChange={setSort} />
            </div>
          </div>
        </div>

        {/* Empty / no-match / grid */}
        <div className="mt-9">
          <AnimatePresence initial={false}>
            {optimisticFavs.length === 0 && (
              <motion.div
                key="global-empty"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant/40 px-6 py-20 text-center">
                  <Heart className="mb-4 h-9 w-9 text-primary/40" />
                  <p
                    className="font-display text-[22px] text-on-surface"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    No favourites yet.
                  </p>
                  <p className="mt-1.5 max-w-xs font-sans text-sm text-on-surface-variant">
                    Open any move in the catalog and tap the heart to save it here.
                  </p>
                </div>
              </motion.div>
            )}
            {optimisticFavs.length > 0 && filtered.length === 0 && (
              <motion.div
                key="no-match"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="py-20 text-center font-sans text-sm text-on-surface-variant">
                  No favourites match &ldquo;{query}&rdquo;.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid stays mounted so AnimatePresence can exit the last card */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
            <AnimatePresence initial={false}>
              {filtered.map((fav) => (
                <motion.div
                  key={fav.id}
                  layout="position"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit={
                    filtered.length === 1 ? { opacity: 0, transition: { duration: 0 } } : 'exit'
                  }
                >
                  <FavouriteCard
                    fav={fav}
                    onRemove={handleOpenRemoveDialog}
                    isPending={isPending}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
