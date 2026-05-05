import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: new URL('../.env.local', import.meta.url).pathname, override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!process.env.SEED_USER_EMAIL) throw new Error('SEED_USER_EMAIL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USER_EMAIL = process.env.SEED_USER_EMAIL;

const PROGRESS: Record<string, 'LEARNED' | 'IN_PROGRESS' | 'WANT_TO_LEARN'> = {
  'Fireman Spin': 'LEARNED',
  'Chair Spin': 'LEARNED',
  'Back Hook Spin': 'LEARNED',
  'Basic Climb': 'LEARNED',
  'Pole Sit': 'LEARNED',
  'Body Roll': 'LEARNED',
  'Pole Crawl': 'LEARNED',
  'Floor Spin': 'LEARNED',

  'Attitude Spin': 'IN_PROGRESS',
  'Carousel Spin': 'IN_PROGRESS',
  'Inside Leg Hang': 'IN_PROGRESS',
  Superman: 'IN_PROGRESS',
  'Iguana Mount': 'IN_PROGRESS',
  'Butterfly to Jade': 'IN_PROGRESS',

  'Cross Knee Release': 'WANT_TO_LEARN',
  Flag: 'WANT_TO_LEARN',
  Handspring: 'WANT_TO_LEARN',
  'Ayesha to Superman': 'WANT_TO_LEARN',
};

const FAVOURITES = [
  'Carousel Spin',
  'Inside Leg Hang',
  'Superman',
  'Butterfly to Jade',
  'Handspring',
];

const POLE_TYPE: Record<string, 'STATIC' | 'SPIN'> = {
  'Fireman Spin': 'SPIN',
  'Chair Spin': 'SPIN',
  'Back Hook Spin': 'SPIN',
  'Attitude Spin': 'SPIN',
  'Carousel Spin': 'SPIN',
  'Floor Spin': 'SPIN',

  'Basic Climb': 'STATIC',
  'Pole Sit': 'STATIC',
  'Inside Leg Hang': 'STATIC',
  'Cross Knee Release': 'STATIC',
  Superman: 'STATIC',
  'Iguana Mount': 'STATIC',
  Flag: 'STATIC',
  Handspring: 'STATIC',
  'Butterfly to Jade': 'STATIC',
  'Ayesha to Superman': 'STATIC',
  'Body Roll': 'STATIC',
  'Pole Crawl': 'STATIC',
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) {
    console.error(`User not found: ${USER_EMAIL}`);
    process.exit(1);
  }

  const moves = await prisma.move.findMany();
  const moveByTitle = Object.fromEntries(moves.map((m) => [m.title_en, m.id]));

  let progressCount = 0;
  for (const [title, status] of Object.entries(PROGRESS)) {
    const moveId = moveByTitle[title];
    if (!moveId) {
      console.warn(`Move not found: ${title}`);
      continue;
    }
    await prisma.userProgress.upsert({
      where: { userId_moveId: { userId: user.id, moveId } },
      update: { status },
      create: { userId: user.id, moveId, status },
    });
    progressCount++;
  }
  console.log(`Upserted ${progressCount} progress records.`);

  let favCount = 0;
  for (const title of FAVOURITES) {
    const moveId = moveByTitle[title];
    if (!moveId) {
      console.warn(`Move not found: ${title}`);
      continue;
    }
    await prisma.userFavourite.upsert({
      where: { userId_moveId: { userId: user.id, moveId } },
      update: {},
      create: { userId: user.id, moveId },
    });
    favCount++;
  }
  console.log(`Upserted ${favCount} favourite records.`);

  let poleTypeCount = 0;
  for (const [title, poleType] of Object.entries(POLE_TYPE)) {
    const moveId = moveByTitle[title];
    if (!moveId) {
      console.warn(`Move not found: ${title}`);
      continue;
    }
    await prisma.move.update({ where: { id: moveId }, data: { poleTypes: [poleType] } });
    poleTypeCount++;
  }
  console.log(`Updated poleTypes for ${poleTypeCount} moves.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
