import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type MoveBreadcrumbProps = {
  category: string;
  moveName: string;
};

export default function MoveBreadcrumb({ category, moveName }: MoveBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex max-w-[1280px] items-center gap-1.5 px-4 pt-6 text-xs text-on-surface-variant sm:px-8"
    >
      <Link href="/catalog" className="transition-colors hover:text-on-surface">
        Catalog
      </Link>
      <ChevronRight size={12} aria-hidden="true" />
      <span className="tracking-widest text-primary uppercase">{category}</span>
      <ChevronRight size={12} aria-hidden="true" />
      <span className="text-on-surface">{moveName}</span>
    </nav>
  );
}
