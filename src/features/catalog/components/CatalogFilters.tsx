'use client';
import { Check, Gauge, RotateCw, Search, Tag, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { Difficulty, PoleType } from '@/shared/types/enums';

import type { MoveFilters } from '@/shared/types';
import type { LocalizedTag } from '@/shared/lib/localize';

const POLE_TYPES = Object.values(PoleType);
const DIFFICULTIES = Object.values(Difficulty);

function buildQuery(
  poleType: PoleType[],
  difficulty: Difficulty[],
  tags: string[],
  search: string,
): string {
  const parts: string[] = [];
  // URL param stays `poleType` (without 's') for stable public URLs; server reads it the same way
  if (poleType.length) parts.push(`poleType=${poleType.join(',')}`);
  if (difficulty.length) parts.push(`difficulty=${difficulty.join(',')}`);
  if (tags.length) parts.push(`tags=${tags.map(encodeURIComponent).join(',')}`);
  if (search) parts.push(`search=${encodeURIComponent(search)}`);
  return parts.join('&');
}

type CatalogFiltersProps = {
  filters: MoveFilters;
  availableTags: LocalizedTag[];
};

export default function CatalogFilters({ filters, availableTags }: CatalogFiltersProps) {
  const t = useTranslations('catalog.filters');
  const te = useTranslations('enums');
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPoleTypes = filters.poleTypes ?? [];
  const selectedDifficulties = filters.difficulty ?? [];
  const selectedTags = filters.tags ?? [];

  const navigate = (overrides: {
    poleTypes?: PoleType[];
    difficulty?: Difficulty[];
    tags?: string[];
    resetSearch?: boolean;
  }) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const nextPoleType = 'poleTypes' in overrides ? overrides.poleTypes! : selectedPoleTypes;
    const nextDifficulty = 'difficulty' in overrides ? overrides.difficulty! : selectedDifficulties;
    const nextTags = 'tags' in overrides ? overrides.tags! : selectedTags;
    const nextSearch = overrides.resetSearch ? '' : searchValue;

    if (overrides.resetSearch) setSearchValue('');

    const query = buildQuery(nextPoleType, nextDifficulty, nextTags, nextSearch);
    router.replace(`/catalog${query ? `?${query}` : ''}`);
  };

  const togglePoleType = (value: PoleType) => {
    const next = selectedPoleTypes.includes(value)
      ? selectedPoleTypes.filter((v) => v !== value)
      : [...selectedPoleTypes, value];
    navigate({ poleTypes: next });
  };

  const toggleDifficulty = (value: Difficulty) => {
    const next = selectedDifficulties.includes(value)
      ? selectedDifficulties.filter((v) => v !== value)
      : [...selectedDifficulties, value];
    navigate({ difficulty: next });
  };

  const toggleTag = (name: string) => {
    const next = selectedTags.includes(name)
      ? selectedTags.filter((v) => v !== name)
      : [...selectedTags, name];
    navigate({ tags: next });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const query = buildQuery(selectedPoleTypes, selectedDifficulties, selectedTags, value);
      router.replace(`/catalog${query ? `?${query}` : ''}`);
    }, 300);
  };

  const isActive =
    selectedPoleTypes.length > 0 ||
    selectedDifficulties.length > 0 ||
    selectedTags.length > 0 ||
    !!filters.search;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={t('searchLabel')}
          placeholder={t('search')}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pr-9 pl-9"
        />
        {searchValue && (
          <button
            type="button"
            aria-label={t('clearSearch')}
            onClick={() => navigate({ resetSearch: true })}
            className="absolute top-1/2 right-2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['pole-state', 'difficulty', 'tags']}
        aria-label="Catalog filters"
        className="w-full"
      >
        <AccordionItem value="pole-state">
          <AccordionTrigger
            className={cn(
              'group cursor-pointer font-sans text-sm font-bold',
              selectedPoleTypes.length > 0 && 'text-primary',
            )}
          >
            <span className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              {t('poleState')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-0.5 pt-3">
              {POLE_TYPES.map((type) => {
                const active = selectedPoleTypes.includes(type);
                const label = te(`poleType.${type}`);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => togglePoleType(type)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pr-3 pl-3 text-left text-sm transition-colors hover:bg-accent',
                      active ? 'bg-primary/10 text-primary' : 'text-on-surface-variant',
                    )}
                  >
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-opacity',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="difficulty">
          <AccordionTrigger
            className={cn(
              'group cursor-pointer font-sans text-sm font-bold',
              selectedDifficulties.length > 0 && 'text-primary',
            )}
          >
            <span className="flex items-center gap-2">
              <Gauge className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              {t('difficulty')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-0.5 pt-3">
              {DIFFICULTIES.map((diff) => {
                const active = selectedDifficulties.includes(diff);
                const label = te(`difficulty.${diff}`);
                return (
                  <button
                    key={diff}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => toggleDifficulty(diff)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pr-3 pl-3 text-left text-sm transition-colors hover:bg-accent',
                      active ? 'bg-primary/10 text-primary' : 'text-on-surface-variant',
                    )}
                  >
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-opacity',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableTags.length > 0 && (
          <AccordionItem value="tags">
            <AccordionTrigger
              className={cn(
                'group cursor-pointer font-sans text-sm font-bold',
                selectedTags.length > 0 && 'text-primary',
              )}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                {t('tags')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5 px-1 pt-3 pb-1">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-label={tag.name}
                      aria-pressed={active}
                      onClick={() => toggleTag(tag.name)}
                      className={cn(
                        'cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                        !active && 'bg-accent/70 text-muted-foreground hover:bg-accent',
                      )}
                      style={
                        active && tag.color
                          ? { backgroundColor: `${tag.color}28`, color: tag.color }
                          : undefined
                      }
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {isActive && (
        <Button
          variant="secondary"
          onClick={() => navigate({ poleTypes: [], difficulty: [], tags: [], resetSearch: true })}
          className="w-full"
        >
          <X className="h-4 w-4" />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  );
}
