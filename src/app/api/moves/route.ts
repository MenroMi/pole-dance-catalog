import { type NextRequest, NextResponse } from 'next/server';

import type { Locale } from '@/i18n/routing';
import { getMovesAction } from '@/features/catalog';

export const dynamic = 'force-dynamic';

// This route has no [locale] segment — callers must pass ?locale= explicitly.
// MoveGrid uses the server action directly and does not call this endpoint;
// this route exists for future external / REST consumers.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = (searchParams.get('locale') ?? 'pl') as Locale;
  const result = await getMovesAction({}, locale);
  return NextResponse.json(result.items);
}
