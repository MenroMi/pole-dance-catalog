import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TAGS: { name_pl: string; name_en: string; color: string }[] = [
  { name_pl: 'Aerial', name_en: 'aerial', color: '#3b82f6' },
  { name_pl: 'Przyjazny Początkującym', name_en: 'beginner-friendly', color: '#22c55e' },
  { name_pl: 'Core', name_en: 'core', color: '#f97316' },
  { name_pl: 'Elastyczność', name_en: 'flexibility', color: '#a855f7' },
  { name_pl: 'Inwersja', name_en: 'inversion', color: '#ec4899' },
  { name_pl: 'Siłowy', name_en: 'strength', color: '#ef4444' },
];

const TAG_MAP: Record<string, string[]> = {
  'Fireman Spin': ['beginner-friendly', 'core'],
  'Chair Spin': ['beginner-friendly'],
  'Back Hook Spin': ['beginner-friendly'],
  'Attitude Spin': ['flexibility', 'core'],
  'Carousel Spin': ['aerial', 'core', 'strength'],
  'Basic Climb': ['beginner-friendly', 'strength'],
  'Pole Sit': ['aerial', 'strength'],
  'Inside Leg Hang': ['aerial', 'inversion', 'strength'],
  'Cross Knee Release': ['aerial', 'inversion', 'strength'],
  Superman: ['aerial', 'flexibility', 'strength'],
  'Iguana Mount': ['aerial', 'flexibility', 'inversion'],
  Flag: ['aerial', 'strength'],
  Handspring: ['aerial', 'flexibility', 'inversion', 'strength'],
  'Butterfly to Jade': ['aerial', 'flexibility', 'inversion'],
  'Ayesha to Superman': ['aerial', 'inversion', 'strength'],
  'Body Roll': ['beginner-friendly', 'flexibility'],
  'Pole Crawl': ['beginner-friendly'],
  'Floor Spin': ['beginner-friendly'],
};

async function main() {
  // upsert tags
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name_en: tag.name_en },
      update: { name_pl: tag.name_pl, color: tag.color },
      create: { name_pl: tag.name_pl, name_en: tag.name_en, color: tag.color },
    });
  }
  console.log(`Upserted ${TAGS.length} tags.`);

  const tags = await prisma.tag.findMany();
  const tagByNameEn = Object.fromEntries(tags.map((t) => [t.name_en, t.id]));

  let updated = 0;
  for (const [titleEn, tagNames] of Object.entries(TAG_MAP)) {
    const move = await prisma.move.findFirst({ where: { title_en: titleEn } });
    if (!move) {
      console.warn(`Move not found: ${titleEn}`);
      continue;
    }

    const tagIds = tagNames.map((n) => ({ id: tagByNameEn[n] }));
    await prisma.move.update({
      where: { id: move.id },
      data: { tags: { connect: tagIds } },
    });
    updated++;
  }

  console.log(`Tagged ${updated} moves.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
