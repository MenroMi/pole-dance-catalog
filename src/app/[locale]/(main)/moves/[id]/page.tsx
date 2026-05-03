import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getMoveByIdAction, getRelatedMovesAction, MovePlayer } from '@/features/moves';
import MoveBreadcrumb from '@/features/moves/components/MoveBreadcrumb';
import RelatedMoves from '@/features/moves/components/RelatedMoves';
import { extractVideoId } from '@/features/moves/lib/youtube';
import { auth } from '@/shared/lib/auth';
import { prisma } from '@/shared/lib/prisma';

export async function generateStaticParams() {
  try {
    const moves = await prisma.move.findMany({ select: { id: true }, take: 1000 });
    return moves.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
}

const getMove = cache(getMoveByIdAction);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const move = await getMove(id, undefined);
  if (!move) return {};

  const videoId = extractVideoId(move.youtubeUrl);
  const image =
    move.imageUrl ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  const description = move.description ?? `Learn the ${move.title} pole dance move.`;

  return {
    title: `${move.title} | Pole Dance Catalog`,
    description,
    openGraph: {
      title: move.title,
      description,
      ...(image && { images: [{ url: image }] }),
    },
  };
}

export default async function MoveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const move = await getMoveByIdAction(id, userId);

  if (!move) return notFound();

  const related = await getRelatedMovesAction(
    move.tags.map((t) => t.id),
    id,
  );

  const isFavourited = move.favourites.length > 0;
  const isAuthenticated = !!userId;

  return (
    <main>
      <MoveBreadcrumb category={move.category} moveName={move.title} />
      <MovePlayer
        title={move.title}
        youtubeUrl={move.youtubeUrl}
        imageUrl={move.imageUrl}
        stepsData={move.stepsData}
        difficulty={move.difficulty}
        description={move.description}
        tags={move.tags}
        poleTypes={move.poleTypes}
        moveId={move.id}
        isFavourited={isFavourited}
        isAuthenticated={isAuthenticated}
        currentProgress={move.currentProgress}
        gripType={move.gripType}
        entry={move.entry}
        duration={move.duration}
        coachNote={move.coachNote}
        coachNoteAuthor={move.coachNoteAuthor}
      />
      <RelatedMoves moves={related} />
    </main>
  );
}
