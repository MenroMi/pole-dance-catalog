import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

import MoveCardImage from '@/features/catalog/components/MoveCardImage';

import { extractVideoId } from '../lib/youtube';

type RelatedMove = {
  id: string;
  title: string;
  difficulty: string;
  imageUrl: string | null;
  youtubeUrl: string;
};

type RelatedMovesProps = {
  moves: RelatedMove[];
};

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: 'text-on-secondary-container',
  INTERMEDIATE: 'text-primary',
  ADVANCED: 'text-amber-300',
};

export default async function RelatedMoves({ moves }: RelatedMovesProps) {
  if (moves.length === 0) return null;

  const t = await getTranslations('moves');

  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <p className="mb-4 font-sans text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
        {t('relatedMoves')}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {moves.map((move) => {
          const videoId = extractVideoId(move.youtubeUrl);
          const thumb =
            move.imageUrl ??
            (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
          const levelColor = DIFFICULTY_COLOR[move.difficulty] ?? 'text-on-surface-variant';

          return (
            <Link
              key={move.id}
              href={`/moves/${move.id}`}
              className="group overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-accent">
                {thumb && <MoveCardImage src={thumb} alt={move.title} />}
              </div>
              <div className="p-3">
                <p className="truncate font-display text-sm font-semibold text-on-surface">
                  {move.title}
                </p>
                <p
                  className={`mt-1 text-[10px] font-semibold tracking-widest uppercase ${levelColor}`}
                >
                  {move.difficulty}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
