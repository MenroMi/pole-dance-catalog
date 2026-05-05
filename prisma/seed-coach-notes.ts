import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const notes: {
  title_en: string;
  coachNote_pl: string;
  coachNote_en: string;
  coachNoteAuthor: string;
}[] = [
  {
    title_en: 'Fireman Spin',
    coachNote_en:
      "Don't rush the momentum — let the swing carry you. The moment you muscle through it, the spin dies. Trust the pole, trust the physics.",
    coachNote_pl:
      'Nie spiesz się z impulsem — pozwól, by wahadło samo cię niosło. Gdy zaczniesz forsować ruch, spin zamiera. Zaufaj słupowi, zaufaj fizyce.',
    coachNoteAuthor: 'Studio Maja, Zagreb',
  },
  {
    title_en: 'Chair Spin',
    coachNote_en:
      'Think of your knees as a single unit. The second they drift apart, your shape collapses. Keep them glued, cross your ankles, and the spin will hold itself.',
    coachNote_pl:
      'Traktuj kolana jak jedną całość. Gdy tylko się rozsuną, kształt się rozpada. Trzymaj je złączone, skrzyżuj kostki, a spin utrzyma się sam.',
    coachNoteAuthor: 'Vertical Dance Academy, London',
  },
  {
    title_en: 'Basic Climb',
    coachNote_en:
      "Your hands are just a guide — the climb lives in your legs. If your arms are doing all the work, your foot grip isn't tight enough. Squeeze, push, rise.",
    coachNote_pl:
      'Ręce to tylko prowadnica — wspinaczka żyje w nogach. Jeśli ramiona robią całą robotę, chwyt stopami nie jest wystarczająco mocny. Ściskaj, pchaj, idź w górę.',
    coachNoteAuthor: 'Polehouse Studios, Berlin',
  },
  {
    title_en: 'Inside Leg Hang',
    coachNote_en:
      'The panic moment is real and it will pass. Once you feel the crook of your knee lock in, breathe out and let your torso drop slowly. Tension is what makes you fall — softness is what keeps you up.',
    coachNote_pl:
      'Moment paniki jest realny i minie. Gdy poczujesz, że zagłębienie kolana się blokuje, zrób wydech i powoli opuść tułów. Napięcie sprawia, że spadasz — miękkość utrzymuje cię w górze.',
    coachNoteAuthor: 'Studio Maja, Zagreb',
  },
  {
    title_en: 'Superman',
    coachNote_en:
      "Keep your gaze slightly up and your jaw soft. The whole aesthetic of this move lives in the line from your crown to your heel — if you're looking at the floor, that line breaks.",
    coachNote_pl:
      'Trzymaj wzrok lekko uniesiony i rozluźnioną szczękę. Cała estetyka tego ruchu żyje w linii od czubka głowy do pięty — gdy patrzysz w podłogę, ta linia się łamie.',
    coachNoteAuthor: 'Aerial Arts Collective, Amsterdam',
  },
  {
    title_en: 'Carousel Spin',
    coachNote_en:
      'Horizontal is not a destination, it is a direction. Most students stop at 45° because they lose nerve. Keep pressing the heels away and let the momentum pull you the rest of the way.',
    coachNote_pl:
      'Poziom to nie cel, to kierunek. Większość uczniów zatrzymuje się na 45°, bo tracą odwagę. Naciskaj piętami dalej i pozwól, by impuls zaciągnął cię do końca.',
    coachNoteAuthor: 'Vertical Dance Academy, London',
  },
];

async function main() {
  console.log(`Adding coach notes to ${notes.length} moves...`);

  let updated = 0;
  let notFound = 0;

  for (const { title_en, coachNote_pl, coachNote_en, coachNoteAuthor } of notes) {
    const move = await prisma.move.findFirst({ where: { title_en } });
    if (!move) {
      console.log(`  ⚠️  Not found: "${title_en}" — skipping`);
      notFound++;
      continue;
    }
    await prisma.move.update({
      where: { id: move.id },
      data: { coachNote_pl, coachNote_en, coachNoteAuthor },
    });
    console.log(`  ✓  Updated: "${title_en}"`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${notFound} not found.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
