import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FIRST_NAMES = [
  'Anna',
  'Marta',
  'Karolina',
  'Natalia',
  'Aleksandra',
  'Monika',
  'Katarzyna',
  'Agnieszka',
  'Paulina',
  'Magdalena',
  'Joanna',
  'Ewelina',
  'Justyna',
  'Dominika',
  'Sylwia',
  'Beata',
  'Izabela',
  'Weronika',
  'Patrycja',
  'Renata',
  'Klaudia',
  'Aneta',
  'Małgorzata',
  'Urszula',
  'Zuzanna',
];

const LAST_NAMES = [
  'Kowalska',
  'Nowak',
  'Wiśniewska',
  'Wójcik',
  'Kowalczyk',
  'Kamińska',
  'Lewandowska',
  'Zielińska',
  'Szymańska',
  'Woźniak',
  'Dąbrowska',
  'Kozłowska',
  'Jankowska',
  'Mazur',
  'Kwiatkowska',
  'Krawczyk',
  'Piotrowska',
  'Grabowska',
  'Nowakowska',
  'Pawłowska',
  'Michalska',
  'Adamska',
  'Dudek',
  'Zawadzka',
  'Wróbel',
];

const LOCATIONS = [
  'Warsaw, Poland',
  'Kraków, Poland',
  'Gdańsk, Poland',
  'Wrocław, Poland',
  'Poznań, Poland',
  'Łódź, Poland',
  'Katowice, Poland',
  'Lublin, Poland',
  'Białystok, Poland',
  'Berlin, Germany',
  'Prague, Czech Republic',
  'Vienna, Austria',
  'London, UK',
  'Amsterdam, Netherlands',
  null,
  null,
  null,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const users = Array.from({ length: 60 }, (_, i) => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const slug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`
      .replace(/ą/g, 'a')
      .replace(/ę/g, 'e')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ł/g, 'l')
      .replace(/ż|ź/g, 'z')
      .replace(/ć/g, 'c')
      .replace(/ń/g, 'n');
    const isAdmin = i < 3;
    const isBlocked = !isAdmin && i >= 55;
    const BLOCK_REASONS = [
      'Spam in comments',
      'Inappropriate content upload',
      'Multiple accounts violation',
      'Harassment of other users',
      'Payment fraud',
    ];
    return {
      email: `${slug}@example.com`,
      firstName,
      lastName,
      location: pick(LOCATIONS),
      role: isAdmin ? ('ADMIN' as const) : ('USER' as const),
      blockedAt: isBlocked ? daysAgo(Math.floor(Math.random() * 30) + 1) : null,
      blockReason: isBlocked ? pick(BLOCK_REASONS) : null,
      createdAt: daysAgo(Math.floor(Math.random() * 365) + 1),
      emailVerified: Math.random() > 0.2 ? daysAgo(Math.floor(Math.random() * 300)) : null,
    };
  });

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.user.create({ data: user });
    created++;
  }

  console.log(`Done: ${created} created, ${skipped} skipped (already existed)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
