import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type StepItem = { text: string; timestamp?: number };

const updates: {
  title_en: string;
  gripType_pl: string;
  gripType_en: string;
  entry_pl: string;
  entry_en: string;
  duration: string;
  poleTypes: ('STATIC' | 'SPIN')[];
  stepsData_pl: StepItem[];
  stepsData_en: StepItem[];
}[] = [
  {
    title_en: 'Fireman Spin',
    gripType_pl: 'Chwyt baseballowy',
    gripType_en: 'Baseball grip',
    entry_pl: 'Stojąc, twarzą do słupa',
    entry_en: 'Standing, facing pole',
    duration: '2–4 counts',
    poleTypes: ['SPIN'],
    stepsData_en: [
      { text: "Stand sideways to the pole at arm's length, inside shoulder facing it.", timestamp: 4 },
      { text: 'Place your inside hand high on the pole at shoulder height, palm facing away.', timestamp: 7 },
      { text: 'Place your outside hand just below, creating a wide grip.', timestamp: 10 },
      { text: 'Swing your outside leg forward and use the momentum to lift off the ground.', timestamp: 28 },
      { text: 'Wrap your inside leg around the pole — this is your anchor.', timestamp: 30 },
      { text: 'Extend your outside leg straight, toes pointed, body long.', timestamp: 35 },
      { text: 'Hold the shape and enjoy the rotation.' },
      { text: 'Land softly by releasing the leg wrap and stepping down.', timestamp: 40 },
    ],
    stepsData_pl: [
      { text: 'Stań bokiem do słupa w odległości ramienia, wewnętrznym barkiem do niego.', timestamp: 4 },
      { text: 'Umieść wewnętrzną rękę wysoko na słupie na wysokości ramienia, dłonią do zewnątrz.', timestamp: 7 },
      { text: 'Umieść zewnętrzną rękę niżej, tworząc szeroki chwyt.', timestamp: 10 },
      { text: 'Wahnij zewnętrzną nogą do przodu i użyj impulsu do uniesienia się.', timestamp: 28 },
      { text: 'Owiń wewnętrzną nogę wokół słupa — to twoja kotwica.', timestamp: 30 },
      { text: 'Wyciągnij zewnętrzną nogę prosto, palce wyciągnięte, ciało długie.', timestamp: 35 },
      { text: 'Utrzymaj kształt i ciesz się obrotem.' },
      { text: 'Ląduj miękko, zwalniając owinięcie nogi i schodząc.', timestamp: 40 },
    ],
  },
  {
    title_en: 'Chair Spin',
    gripType_pl: 'Split grip',
    gripType_en: 'Split grip',
    entry_pl: 'Stojąc, twarzą do słupa',
    entry_en: 'Standing, facing pole',
    duration: '2–4 counts',
    poleTypes: ['SPIN'],
    stepsData_en: [
      { text: 'Stand facing the pole, feet together.', timestamp: 5 },
      { text: 'Place your dominant hand high on the pole, palm facing in. Place your other hand lower, palm out — this is split grip.', timestamp: 10 },
      { text: 'Swing your outer leg forward to build momentum and jump.', timestamp: 18 },
      { text: "Bring both knees up together as if you're sitting in a chair.", timestamp: 25 },
      { text: 'Cross your ankles, point your toes, and keep your back slightly arched.' },
      { text: 'Keep your elbows soft — squeezing too hard kills the spin.' },
      { text: 'As the spin slows, uncross your legs and step down.', timestamp: 40 },
    ],
    stepsData_pl: [
      { text: 'Stań twarzą do słupa, stopy razem.', timestamp: 5 },
      { text: 'Umieść dominującą rękę wysoko na słupie, dłonią do wewnątrz. Drugą rękę niżej, dłonią na zewnątrz — to split grip.', timestamp: 10 },
      { text: 'Wahnij zewnętrzną nogą do przodu, by zbudować impuls, i skocz.', timestamp: 18 },
      { text: 'Unieś oba kolana razem, jakbyś siadała na krześle.', timestamp: 25 },
      { text: 'Skrzyżuj kostki, wyciągnij palce i lekko odchyl plecy.' },
      { text: 'Trzymaj łokcie miękko — zbyt mocny uścisk zabija spin.' },
      { text: 'Gdy spin zwalnia, rozkrzyżuj nogi i zejdź.', timestamp: 40 },
    ],
  },
  {
    title_en: 'Carousel Spin',
    gripType_pl: 'Split grip',
    gripType_en: 'Split grip',
    entry_pl: 'Stojąc, twarzą do słupa',
    entry_en: 'Standing, facing pole',
    duration: '4–6 counts',
    poleTypes: ['SPIN'],
    stepsData_en: [
      { text: 'Stand facing the pole. Place your top hand high in split grip, bottom hand at hip height.', timestamp: 5 },
      { text: 'Kick your outer leg to the side and use the momentum to lift both feet off the ground.', timestamp: 15 },
      { text: 'Let your body fall horizontal — aim to be parallel to the floor.', timestamp: 22 },
      { text: 'Extend both legs away from the pole, heels pressing outward.' },
      { text: 'Engage your core to keep your hips level and body flat.' },
      { text: 'Point your toes and hold the line from head to heel.', timestamp: 38 },
      { text: 'Let the spin slow naturally, then tuck your knees and step down.', timestamp: 50 },
    ],
    stepsData_pl: [
      { text: 'Stań twarzą do słupa. Górną rękę wysoko w split gripie, dolną rękę na wysokości bioder.', timestamp: 5 },
      { text: 'Kopnij zewnętrzną nogą w bok i użyj impulsu do uniesienia obu nóg.', timestamp: 15 },
      { text: 'Pozwól ciału opaść poziomo — celuj w równoległość z podłogą.', timestamp: 22 },
      { text: 'Wyciągnij obie nogi od słupa, naciskając piętami na zewnątrz.' },
      { text: 'Zaangażuj core, by utrzymać biodra poziomo i ciało płaskie.' },
      { text: 'Wyciągnij palce i utrzymaj linię od głowy do pięty.', timestamp: 38 },
      { text: 'Pozwól spinowi naturalnie zwolnić, złóż kolana i zejdź.', timestamp: 50 },
    ],
  },
  {
    title_en: 'Inside Leg Hang',
    gripType_pl: 'Chwyt zewnętrznym łokciem',
    gripType_en: 'Outside elbow grip',
    entry_pl: 'Ze wspinaczki lub stojąc',
    entry_en: 'From climb or standing',
    duration: 'Hold 2–4 counts',
    poleTypes: ['STATIC'],
    stepsData_en: [
      { text: 'Climb to a comfortable height — at least waist level above the floor.', timestamp: 8 },
      { text: 'Bring the pole to the crook of one knee (inside leg), squeezing firmly.', timestamp: 18 },
      { text: 'Wrap the foot of that leg around the pole and point the toe to lock the grip.', timestamp: 27 },
      { text: 'Engage your core and slowly lower your hands away from the pole.', timestamp: 35 },
      { text: 'Let your torso drop back — keep the leg squeeze active the entire time.', timestamp: 42 },
      { text: 'Extend your free leg long and point both feet.' },
      { text: 'Hold the position, feeling the stretch through your torso.' },
      { text: 'To exit, reach back up to the pole with both hands before releasing the leg.', timestamp: 60 },
    ],
    stepsData_pl: [
      { text: 'Wspinaj się na wygodną wysokość — co najmniej na poziomie talii ponad podłogą.', timestamp: 8 },
      { text: 'Przyłóż słup do zagłębienia jednego kolana (wewnętrzna noga), mocno ściskając.', timestamp: 18 },
      { text: 'Owiń stopę tej nogi wokół słupa i wyciągnij palce, by zablokować chwyt.', timestamp: 27 },
      { text: 'Zaangażuj core i powoli odsuń ręce od słupa.', timestamp: 35 },
      { text: 'Pozwól tułowiowi opaść do tyłu — utrzymuj aktywny ucisk nogi przez cały czas.', timestamp: 42 },
      { text: 'Wyciągnij wolną nogę i wyciągnij palce obu stóp.' },
      { text: 'Utrzymaj pozycję, czując rozciąganie przez tułów.' },
      { text: 'Aby wyjść, sięgnij z powrotem do słupa obiema rękami przed zwolnieniem nogi.', timestamp: 60 },
    ],
  },
  {
    title_en: 'Superman',
    gripType_pl: 'Chwyt zewnętrznym łokciem',
    gripType_en: 'Outside elbow grip',
    entry_pl: 'Ze wspinaczki lub Siedzenia na Słupie',
    entry_en: 'From climb or Pole Sit',
    duration: 'Hold 2–4 counts',
    poleTypes: ['STATIC'],
    stepsData_en: [
      { text: 'From a Pole Sit (thighs crossed around the pole), place one hand high and one hand low.', timestamp: 8 },
      { text: 'Engage the outside elbow against the pole to create a secondary grip point.', timestamp: 16 },
      { text: 'Slowly lean your body forward and away from the pole.', timestamp: 25 },
      { text: 'Extend your top leg long behind you, pressing the heel toward the ceiling.', timestamp: 33 },
      { text: 'Your bottom leg can hook the pole or extend parallel — choose based on comfort.' },
      { text: 'Release your hands one at a time once you feel stable in the hold.', timestamp: 45 },
      { text: "Stretch your arms forward like you're flying — gaze slightly up." },
      { text: 'To exit, reach back to the pole, re-engage your leg grip, and climb down.', timestamp: 58 },
    ],
    stepsData_pl: [
      { text: 'Z Siedzenia na Słupie (uda skrzyżowane wokół słupa) umieść jedną rękę wysoko, drugą nisko.', timestamp: 8 },
      { text: 'Przyciśnij zewnętrzny łokieć do słupa, tworząc dodatkowy punkt chwytu.', timestamp: 16 },
      { text: 'Powoli pochyl ciało do przodu i od słupa.', timestamp: 25 },
      { text: 'Wyciągnij górną nogę za siebie, naciskając piętą ku sufitowi.', timestamp: 33 },
      { text: 'Dolna noga może hookować słup lub wyciągnąć się równolegle — wybierz wg komfortu.' },
      { text: 'Zwolnij ręce po jednej, gdy poczujesz stabilność w holdzie.', timestamp: 45 },
      { text: 'Wyciągnij ręce do przodu jak do lotu — wzrok lekko uniesiony.' },
      { text: 'Aby wyjść, sięgnij z powrotem do słupa, reaktywuj chwyt nogami i zejdź.', timestamp: 58 },
    ],
  },
  {
    title_en: 'Basic Climb',
    gripType_pl: 'Standardowy chwyt',
    gripType_en: 'Standard grip',
    entry_pl: 'Stojąc, twarzą do słupa',
    entry_en: 'Standing, facing pole',
    duration: '2–3 counts per step',
    poleTypes: ['STATIC'],
    stepsData_en: [
      { text: 'Stand facing the pole, feet hip-width apart.', timestamp: 5 },
      { text: 'Place both hands on the pole above your head, thumbs down.', timestamp: 10 },
      { text: 'Jump and wrap your dominant (inside) leg around the pole at the knee.', timestamp: 17 },
      { text: 'Squeeze the pole between your inner knee and the top of your foot.', timestamp: 25 },
      { text: 'Use your hands to pull up while your feet push against the pole.', timestamp: 32 },
      { text: 'Move your lower leg grip up, then hands — alternate in a crawling motion.' },
      { text: 'Keep your elbows bent and core engaged throughout.' },
      { text: 'To descend, reverse the motion slowly — never slide uncontrolled.', timestamp: 55 },
    ],
    stepsData_pl: [
      { text: 'Stań twarzą do słupa, stopy na szerokość bioder.', timestamp: 5 },
      { text: 'Umieść obie ręce na słupie ponad głową, kciukami w dół.', timestamp: 10 },
      { text: 'Skocz i owiń dominującą (wewnętrzną) nogę wokół słupa przy kolanie.', timestamp: 17 },
      { text: 'Ściśnij słup między wewnętrznym kolanem a wierzchem stopy.', timestamp: 25 },
      { text: 'Użyj rąk do podciągania, gdy nogi odpychają od słupa.', timestamp: 32 },
      { text: 'Przesuń chwyt dolnej nogi w górę, potem ręce — naprzemiennie jak w czołganiu.' },
      { text: 'Trzymaj łokcie zgięte i core zaangażowane przez cały czas.' },
      { text: 'Aby zejść, odwróć ruch powoli — nigdy nie zsuwaj się bez kontroli.', timestamp: 55 },
    ],
  },
];

async function main() {
  console.log(`Updating ${updates.length} moves with stepsData and detail fields...`);

  let updated = 0;
  let notFound = 0;

  for (const { title_en, ...data } of updates) {
    const move = await prisma.move.findFirst({ where: { title_en } });
    if (!move) {
      console.log(`  ⚠️  Not found: "${title_en}" — skipping`);
      notFound++;
      continue;
    }
    await prisma.move.update({ where: { id: move.id }, data });
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
