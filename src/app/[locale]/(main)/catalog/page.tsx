import { getMovesAction, getTagsAction, CatalogFilters, MoveGrid } from '@/features/catalog';
import PageShell from '@/shared/components/PageShell';
import type { MoveFilters } from '@/shared/types';
import { PoleType, Difficulty } from '@/shared/types/enums';
import type { Locale } from '@/i18n/routing';

type SearchParams = Promise<{
  poleType?: string;
  difficulty?: string;
  tags?: string;
  search?: string;
}>;

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: SearchParams;
};

const validPoleTypes = new Set<string>(Object.values(PoleType));
const validDifficulties = new Set<string>(Object.values(Difficulty));

function parseEnumArray<T extends string>(param: string | undefined, valid: Set<string>): T[] {
  if (!param) return [];
  return param.split(',').filter((v) => valid.has(v)) as T[];
}

function parseTagNames(param: string | undefined): string[] {
  if (!param) return [];
  return param.split(',').filter(Boolean).map(decodeURIComponent);
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const filters: MoveFilters = {
    poleTypes: parseEnumArray<PoleType>(sp.poleType, validPoleTypes),
    difficulty: parseEnumArray<Difficulty>(sp.difficulty, validDifficulties),
    tags: parseTagNames(sp.tags),
    search: sp.search || undefined,
  };

  const [result, availableTags] = await Promise.all([
    getMovesAction({ ...filters, page: 1, pageSize: 12 }, locale),
    getTagsAction(locale),
  ]);

  const initialHasMore = result.total > result.items.length;

  return (
    <PageShell aside={<CatalogFilters filters={filters} availableTags={availableTags} />}>
      <MoveGrid
        key={JSON.stringify(filters)}
        initialMoves={result.items}
        initialHasMore={initialHasMore}
        totalCount={result.total}
        filters={filters}
        locale={locale}
      />
    </PageShell>
  );
}
