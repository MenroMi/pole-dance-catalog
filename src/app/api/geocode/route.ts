import { NextRequest, NextResponse } from 'next/server';

import { geocodeRatelimit } from '@/shared/lib/ratelimit';

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    process.env.RATELIMIT_FALLBACK_IP!;
  const { success } = await geocodeRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (
    !isFinite(latNum) ||
    !isFinite(lonNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lonNum < -180 ||
    lonNum > 180
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const ua = process.env.NOMINATIM_USER_AGENT;
  if (!ua) {
    return NextResponse.json({ error: 'Geocoding not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lonNum}&format=json&accept-language=en`,
      { headers: { 'User-Agent': ua } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
    }

    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; country?: string };
    };

    const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? '';
    const country = data.address?.country ?? '';
    const location = [city, country].filter(Boolean).join(', ');

    return NextResponse.json({ location: location || null });
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
  }
}
