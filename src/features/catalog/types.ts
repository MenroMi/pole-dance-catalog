import type { LocalizedMove, LocalizedTag } from '@/shared/lib/localize';

export type { LocalizedTag };

export type LocalizedMoveWithTags = LocalizedMove & { tags: LocalizedTag[] };
