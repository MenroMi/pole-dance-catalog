import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const moves = [
  // SPINS
  {
    title_pl: 'Spin Strażaka',
    title_en: 'Fireman Spin',
    description_pl:
      'Podstawowy spin. Obie ręce, zewnętrzna noga owija, wewnętrzna wyciąga — pierwszy spin każdej tancerki.',
    description_en:
      'Foundational spin. Two hands, outside leg wraps, inside leg extends — the first spin every dancer learns.',
    difficulty: 'BEGINNER' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=firemanspi01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin na Krześle',
    title_en: 'Chair Spin',
    description_pl:
      'Spin w pozycji krzesła — kolana razem, palce wyciągnięte, ciało lekko odchylone.',
    description_en:
      'Seated-pose spin — knees together, toes pointed, body leaning back like a chair in motion.',
    difficulty: 'BEGINNER' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=chairspin001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin na Tylnym Haku',
    title_en: 'Back Hook Spin',
    description_pl: 'Spin na impulsie z tylnym hakiem nogi. Dobra rozgrzewka.',
    description_en:
      'Momentum-driven spin where the back leg hooks the pole behind you. Great warm-up spin.',
    difficulty: 'BEGINNER' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=backhooksp01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin w Attitude',
    title_en: 'Attitude Spin',
    description_pl:
      'Elegancki spin z nogą w pozycji attitude — zgiętą pod kątem 90°, stopą z tyłu.',
    description_en:
      'Elegant spin with one leg in attitude position — bent at 90 degrees, foot flexed behind.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=attitudespn1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin Karuzelowy',
    title_en: 'Carousel Spin',
    description_pl: 'Horyzontalny spin z ciałem równoległym do podłogi. Wymaga zaangażowania core.',
    description_en:
      'Horizontal spin with body parallel to the floor, one hand high, one low. Needs core engagement.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=carouselsp01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // CLIMBS
  {
    title_pl: 'Wejście na Słup',
    title_en: 'Basic Climb',
    description_pl: 'Wewnętrzna noga hookuje, zewnętrzna popycha — podstawowy ruch wertykalny.',
    description_en: 'Inside leg hooks, outside leg pushes — your foundational vertical movement.',
    difficulty: 'BEGINNER' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=basicclimb01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Siedzenie na Słupie',
    title_en: 'Pole Sit',
    description_pl: 'Skrzyżuj uda wokół słupa podczas wspinaczki do siedzenia bez rąk.',
    description_en:
      'Cross the thighs around the pole while climbing to hands-free seated position.',
    difficulty: 'BEGINNER' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=polesit00001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Zwis na Wewnętrznej Nodze',
    title_en: 'Inside Leg Hang',
    description_pl:
      'Zwis odwrócony na wewnętrznej nodze. Pierwszy zwis na samych nogach, którego uczą się tancerki.',
    description_en:
      'Hang inverted from the inside leg grip. First leg-only hold most dancers learn.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=insidelegh01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Zwis Krzyżowy z Kolanem',
    title_en: 'Cross Knee Release',
    description_pl:
      'Zaawansowane combo wspinaczka-hold. Skrzyżowane kolana wokół słupa, zwolnienie rąk. Wymaga zaufania do chwytu.',
    description_en:
      'Advanced climb-to-hold combo. Cross knees around the pole, release hands. Requires trust in grip.',
    difficulty: 'ADVANCED' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=crosskneeR1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // HOLDS
  {
    title_pl: 'Superman',
    title_en: 'Superman',
    description_pl:
      'Horyzontalna pozycja przodem — jedna noga hookuje, ciało wyciąga się prosto jak do lotu. Niezbędne core i chwyt.',
    description_en:
      'Horizontal prone hold — one leg hooks, body extends straight like flying. Core and grip essential.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=supermanhld1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Pozycja Iguany',
    title_en: 'Iguana Mount',
    description_pl:
      'Odwróć się, wygnij plecy, chwyć słup rękami i kostkami — sylwetka jak jaszczurka.',
    description_en:
      'Invert, arch back, grip pole with hands and ankles — named for the lizard-like silhouette.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=iguanamount1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Flaga',
    title_en: 'Flag',
    description_pl:
      'Horyzontalny hold z montem na ramieniu. Ciało prostopadle do słupa. Wymagana duża siła ramion.',
    description_en:
      'Horizontal shoulder-mount hold. Body juts out perpendicular to the pole. Significant shoulder strength.',
    difficulty: 'ADVANCED' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=flagmove0001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Handspring',
    title_en: 'Handspring',
    description_pl:
      'Stójka na słupie z rozłożonymi nogami. Jeden z najtrudniejszych holdów — wymaga mobilności nadgarstków i ramion.',
    description_en:
      'Handstand on the pole with legs split. One of the hardest holds — demands wrist and shoulder mobility.',
    difficulty: 'ADVANCED' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=handspring01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // COMBOS
  {
    title_pl: "Z Motyla do Jade'a",
    title_en: 'Butterfly to Jade',
    description_pl:
      'Przejście z inversji butterfly do jade split. Klasyczny flow średniozaawansowany.',
    description_en:
      'Transition from butterfly inversion into a jade split. Classic intermediate flow.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'COMBOS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=buttertojd01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Z Ayesha do Supermana',
    title_en: 'Ayesha to Superman',
    description_pl:
      'Hold straddle-handspring (Ayesha) przechodzący w Supermana. Combo na poziomie zaawansowanym.',
    description_en: 'Straddle-hold handspring (Ayesha) descending into Superman. High-level combo.',
    difficulty: 'ADVANCED' as const,
    category: 'COMBOS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=ayeshatosup1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // FLOORWORK
  {
    title_pl: 'Falowanie Ciałem',
    title_en: 'Body Roll',
    description_pl: 'Falowanie ciałem na podłodze od głowy do bioder. Fundament floorworku.',
    description_en: 'Floor-based undulation from head to hips. Foundation of sensual floorwork.',
    difficulty: 'BEGINNER' as const,
    category: 'FLOORWORK' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=bodyroll0001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Czołganie przy Słupie',
    title_en: 'Pole Crawl',
    description_pl: 'Niskie czołganie na czworakach wokół słupa — nadaje ton rutynie podłogowej.',
    description_en:
      'Low prowl on all fours circling the pole — sets the tone for a floor-focused routine.',
    difficulty: 'BEGINNER' as const,
    category: 'FLOORWORK' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=polecrawl001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin Podłogowy',
    title_en: 'Floor Spin',
    description_pl:
      'Spin siedzący iniciowany z podłogi — jedna ręka chwyta słup, ciało zakręca się wokół jego podstawy.',
    description_en:
      'Seated spin initiated from the floor — one hand grabs the pole, body spirals around its base.',
    difficulty: 'BEGINNER' as const,
    category: 'FLOORWORK' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=floorspin001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // SPINS (extra)
  {
    title_pl: 'Spin Motylkowy',
    title_en: 'Butterfly Spin',
    description_pl: 'Spin z otwartymi nogami w split — ciało obraca się symetrycznie wokół słupa.',
    description_en: 'Split-leg spin rotating symmetrically around the pole.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=butterflyspin1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin Jednorękowy',
    title_en: 'One-Hand Spin',
    description_pl: 'Spin na jednej ręce — wymaga silnego chwytu i zaangażowania core.',
    description_en: 'Single-arm spin requiring a strong grip and engaged core.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=onehandspin01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Spin Gemini',
    title_en: 'Gemini Spin',
    description_pl: 'Odwrócony spin na zewnętrznej nodze — noga hookuje od zewnątrz w dół.',
    description_en: 'Inverted spin on the outside leg hook, body opens outward.',
    difficulty: 'ADVANCED' as const,
    category: 'SPINS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=geminispin001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // HOLDS (extra)
  {
    title_pl: 'Jeleń',
    title_en: 'Stag',
    description_pl: 'Hold z odgiętymi kolanami w różnych kierunkach — sylwetka jelenia w locie.',
    description_en:
      'Inverted hold with knees bent in opposite directions — deer mid-leap silhouette.',
    difficulty: 'ADVANCED' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=staghold00001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Ayesha',
    title_en: 'Ayesha',
    description_pl: 'Straddle handstand na słupie z rozłożonymi nogami. Wymaga siły ramion i core.',
    description_en: 'Straddle handstand on the pole — shoulder and core strength essential.',
    difficulty: 'ADVANCED' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=ayeshahold001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Chomik',
    title_en: 'Brass Monkey',
    description_pl:
      'Zwis odwrócony z zewnętrznym hakiem nogi — ciało otwarte bokiem, zwolnienie rąk.',
    description_en: 'Inverted outside leg hang — body opens sideways with hands released.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'HOLDS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=brassmonk001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // CLIMBS (extra)
  {
    title_pl: 'Wspinaczka Odwrócona',
    title_en: 'Inverted Climb',
    description_pl: 'Wspinaczka głową w dół — nogi prowadzą ruch, ręce stabilizują.',
    description_en: 'Climbing upside down — legs lead, hands stabilise.',
    difficulty: 'ADVANCED' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=invertclimb01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Wejście na Kolano',
    title_en: 'Knee Mount',
    description_pl: 'Wejście na słup z oparciem na kolanie — dobry punkt wejścia do inversji.',
    description_en: 'Mount using the knee as a pivot point — common entry to inversions.',
    difficulty: 'BEGINNER' as const,
    category: 'CLIMBS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=kneemount001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // COMBOS (extra)
  {
    title_pl: 'Spin do Zwisu',
    title_en: 'Spin to Hang',
    description_pl: 'Przejście ze spinu w pełny zwis nożny — płynne połączenie dynamiki i statyki.',
    description_en:
      'Transition from a spin directly into a leg hang — flow between dynamic and static.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'COMBOS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=spintohang01',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Sekwencja Podłogowa',
    title_en: 'Floorwork Sequence',
    description_pl:
      'Połączenie body roll, czołgania i spinu podłogowego w jednym płynnym fragmencie.',
    description_en: 'Body roll into pole crawl into floor spin — one continuous floorwork phrase.',
    difficulty: 'BEGINNER' as const,
    category: 'COMBOS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=floorseq0001',
    stepsData_pl: [],
    stepsData_en: [],
  },
  {
    title_pl: 'Handspring do Flagi',
    title_en: 'Handspring to Flag',
    description_pl: 'Z handspringu obrót do pozycji flagi — zaawansowane combo siłowe.',
    description_en: 'From handspring, rotate out to flag position — high-level strength combo.',
    difficulty: 'ADVANCED' as const,
    category: 'COMBOS' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=handsprtofg1',
    stepsData_pl: [],
    stepsData_en: [],
  },
  // FLOORWORK (extra)
  {
    title_pl: 'Obrót na Podłodze',
    title_en: 'Floor Pirouette',
    description_pl: 'Piruet siedzący z oparciem o słup — precyzyjna technika obrotowa.',
    description_en: 'Seated pirouette braced against the pole — precise rotational technique.',
    difficulty: 'INTERMEDIATE' as const,
    category: 'FLOORWORK' as const,
    youtubeUrl: 'https://www.youtube.com/watch?v=floorpirouet1',
    stepsData_pl: [],
    stepsData_en: [],
  },
];

async function main() {
  await prisma.userProgress.deleteMany();
  await prisma.userFavourite.deleteMany();
  await prisma.move.deleteMany();

  for (const move of moves) {
    // poleTypes has no DB default despite migration — must be passed explicitly
    await prisma.move.create({ data: { ...move, poleTypes: [] } });
  }

  console.log(`Seeded ${moves.length} moves.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
