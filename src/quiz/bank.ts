/* Banque de questions générée à partir des fiches (lib/fiches.ts) : chaque fiche donne plusieurs questions,
   et chaque question renvoie à sa fiche pour réviser. Les leurres sont tirés au sort (graine contrôlée). */
import { geoContains } from 'd3';
import { ALL_CODES, ERAS, NAMES, PRE, WAR, deName, type CantonCode, type PortraitParams } from '../lib/data';
import { FICHES, TRADITIONS, type Cat, type Fiche } from '../lib/fiches';
import { cantonFeatures } from '../lib/geo';
import { fmtYear } from '../lib/time';
import { distinct, pick, shuffle, type Rng } from './rng';

export type Diff = 1 | 2 | 3;

export interface Question {
  id: string;
  kind: string;
  prompt: string;
  headline?: string;
  context?: string;
  portrait?: { fig: PortraitParams; bg: string };
  /** Illustration à reconnaître */
  image?: string;
  choices: string[];
  answer: number;
  codes: CantonCode[];
  era: number;
  cat: Cat;
  diff: Diff;
  explain: string;
  /** Fiche à relire */
  fiche: string;
}

export interface Factory {
  id: string;
  kind: string;
  family: string;
  subject: string;
  fiche: string;
  cat: Cat;
  codes: CantonCode[];
  era: number;
  diff: Diff;
  make: (rng: Rng) => Question | null;
}

type Base = Pick<Question, 'prompt' | 'explain'> & Partial<Pick<Question, 'headline' | 'context' | 'portrait' | 'image'>>;
type Meta = Pick<Factory, 'id' | 'kind' | 'codes' | 'era' | 'diff' | 'fiche' | 'cat'>;

function mcq(f: Meta, rng: Rng, correct: string, wrong: string[], base: Base): Question | null {
  if (wrong.length < 1) return null;
  const choices = shuffle([correct, ...wrong], rng);
  return { ...base, id: f.id, kind: f.kind, codes: f.codes, era: f.era, diff: f.diff, fiche: f.fiche, cat: f.cat, choices, answer: choices.indexOf(correct) };
}

/** Masque les noms propres d'un texte (pour « de quoi parle-t-on ? »). */
const STOP = /^(Lac|lac|ville|Comtes|Abbé|Évêque|Prince|Peuples|Hautes|vallées|puis|Fête|fête|dans|avec|pour|plus|leur|Les|les|des|une)$/;
export function mask(text: string, names: (string | null | undefined)[]): string {
  let t = text;
  for (const n of names) {
    if (!n) continue;
    for (const w of n.split(/[\s’',()«»-]+/).filter(w => w.length >= 4 && !STOP.test(w))) {
      const stem = w.slice(0, Math.max(4, w.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`${stem}[\\p{L}]*`, 'giu'), '…');
    }
  }
  return t;
}

const cantonAt = (lat: number, lon: number) => cantonFeatures.find(f => geoContains(f, [lon, lat]))?.code;

/** Leurres de cantons : on mélange voisins de liste et cantons au hasard. */
const wrongCantons = (ok: CantonCode[], rng: Rng) => distinct(ALL_CODES.filter(c => !ok.includes(c)), 3, rng).map(c => NAMES[c]);

/** Vainqueur côté A ou B (WAR = [guerre, camp A, camp B, vainqueur]) ; null = indécis. */
const WINNER: Record<string, 'A' | 'B' | null> = {
  'César arrête les Helvètes': 'B', 'Rome conquiert les Alpes': 'A', 'Morgarten': 'A', 'Laupen': 'A', 'Sempach': 'A', 'Näfels': 'A',
  'Conquête de l’Argovie': 'A', 'Arbedo': 'B', 'Saint-Jacques sur la Birse': 'B', 'Grandson et Morat': 'A', 'Giornico': 'A', 'Calven': 'A',
  'Dornach et la guerre de Souabe': 'A', 'Marignan': 'B', 'Kappel': 'B', 'Berne conquiert le Pays de Vaud': 'A', 'L’Escalade': 'A',
  'La guerre des Paysans': 'B', 'Première bataille de Villmergen': 'A', 'Seconde bataille de Villmergen': 'A', 'L’invasion française': 'B',
  'Neuenegg': 'A', 'Le soulèvement de Nidwald': 'B', 'Souvorov dans les Alpes': null, 'Les batailles de Zurich': 'A',
  'La guerre du Sonderbund': 'A', 'Saint-Jacques sur la Sihl': 'A', 'Grindelwald': 'A', 'Vögelinsegg': 'A', 'Le Stoss': 'A',
  'Rothenthurm': 'A', 'Viège': 'A',
};

/** Une image ne sert de question que si elle n'illustre qu'une seule fiche. */
const imageUses = new Map<string, number>();
for (const f of FICHES) if (f.illus) imageUses.set(f.illus.source, (imageUses.get(f.illus.source) ?? 0) + 1);
const uniqueImage = (f: Fiche) => !!f.illus && imageUses.get(f.illus.source) === 1;

function buildFactories(): Factory[] {
  const F: Factory[] = [];
  const add = (f: Factory) => F.push(f);
  const meta = (f: Fiche, kind: string, family: string, diff: Diff, extra: Partial<Factory> = {}) =>
    ({ id: `${kind}:${f.id}`, kind, family, subject: f.id, fiche: f.id, cat: f.cat, codes: f.codes, era: f.era, diff, ...extra });

  const byCat = (c: Cat) => FICHES.filter(f => f.cat === c);
  const events = byCat('evenement'), places = byCat('lieu'), trads = byCat('tradition'), peoples = byCat('peuple');

  /* Reconnaître l'illustration (toutes catégories) */
  for (const f of FICHES) {
    if (!uniqueImage(f)) continue;
    const pool = FICHES.filter(o => o.cat === f.cat && o.id !== f.id && (f.cat !== 'evenement' || Math.abs(o.era - f.era) <= 2));
    add({
      ...meta(f, 'img', 'image', 2),
      make(rng) {
        return mcq(this, rng, f.title, distinct(pool.map(o => o.title), 3, rng, [f.title]), {
          prompt: f.cat === 'lieu' ? 'Quelle ville voit-on ?' : f.cat === 'tradition' ? 'Quelle tradition illustre cette image ?' : 'Quelle fiche illustre cette image ?',
          image: f.illus!.src, explain: `${f.title} (${f.dateLabel}). ${f.text}`,
        });
      },
    });
  }

  /* ===== Événements ===== */
  const warNames = [...new Set(Object.values(WAR).map(w => w[0]))];
  for (const f of events) {
    const e = f.ev!, era = f.era;
    add({
      ...meta(f, 'evy', 'year', e.lvl === 1 ? 1 : 2),
      make(rng) {
        const pool = events.filter(x => Math.abs(x.era - era) <= 1 && x.year !== e.year).map(x => x.year!);
        const extra = [-1, 1, -2, 2].map(k => e.year + k * (era <= 2 ? 150 : era <= 4 ? 60 : 17));
        const wrong = distinct([...pool, ...extra].filter(y => y !== e.year && y >= -15000 && y <= 2026), 3, rng).map(fmtYear);
        return mcq(this, rng, fmtYear(e.year), wrong, { prompt: 'En quelle année ?', headline: e.title, explain: e.text });
      },
    });
    add({
      ...meta(f, 'evt', 'identify', e.lvl === 1 ? 2 : 3),
      make(rng) {
        const pool = events.filter(x => x.id !== f.id && Math.abs(x.era - era) <= 1).map(x => x.title);
        return mcq(this, rng, e.title, distinct(pool, 3, rng, [e.title]), {
          prompt: `De quel événement parle-t-on ? (${fmtYear(e.year)})`, context: mask(e.text, [e.title]), explain: e.text,
        });
      },
    });
    // Où ? (canton actuel)
    const accept = [...new Set([e.code, cantonAt(e.lat, e.lon)].filter(Boolean) as CantonCode[])];
    if (e.title !== 'Marignan') add({
      ...meta(f, 'evc', 'where', e.lvl === 1 ? 1 : 2),
      make(rng) {
        return mcq(this, rng, NAMES[e.code], wrongCantons(accept, rng), {
          prompt: 'Dans quel canton actuel cela s’est-il passé ?', headline: `${fmtYear(e.year)} · ${e.title}`, explain: `Canton ${deName(e.code)}. ${e.text}`,
        });
      },
    });
    if (e.lvl === 1) add({
      ...meta(f, 'evo', 'order', 2),
      make(rng) {
        const other = pick(events.filter(x => x.ev!.lvl === 1 && Math.abs(x.year! - e.year) >= 5 && Math.abs(x.era - era) <= 1), rng);
        if (!other) return null;
        const first = e.year < other.year! ? f : other, second = first === f ? other : f;
        return mcq(this, rng, first.title, [second.title], {
          prompt: 'Lequel s’est produit en premier ?', explain: `${first.title} : ${first.dateLabel}. ${second.title} : ${second.dateLabel}.`,
        });
      },
    });
    const w = WAR[e.title];
    if (w) {
      add({
        ...meta(f, 'batw', 'war', 2),
        make(rng) {
          return mcq(this, rng, w[0], distinct(warNames, 3, rng, [w[0]]), {
            prompt: 'De quelle guerre fait partie cette bataille ?', headline: `${e.title} (${fmtYear(e.year)})`,
            explain: `${w[0]} : ${w[1]} contre ${w[2]}. Vainqueur : ${w[3]}.`,
          });
        },
      });
      const side = WINNER[e.title];
      if (side) add({
        ...meta(f, 'batv', 'war', 1),
        make(rng) {
          return mcq(this, rng, side === 'A' ? w[1] : w[2], [side === 'A' ? w[2] : w[1]], {
            prompt: 'Qui l’a emporté ?', headline: `${e.title} (${fmtYear(e.year)})`, explain: `Vainqueur : ${w[3]}. ${e.text}`,
          });
        },
      });
    }
  }

  /* ===== Lieux ===== */
  const ancient = places.filter(f => f.city!.names.length >= 2 && f.city!.names[0][1] && f.city!.names[0][0] < 600);
  const MAJOR = new Set(['Genève', 'Zurich', 'Berne', 'Bâle', 'Lausanne', 'Lugano', 'Lucerne', 'Saint-Gall']);
  for (const f of places) {
    const c = f.city!, now = f.title;
    if (c.names[c.names.length - 1][1]) add({
      ...meta(f, 'cic', 'where', MAJOR.has(now) ? 1 : 2),
      make(rng) {
        return mcq(this, rng, NAMES[c.code], wrongCantons([c.code], rng), {
          prompt: 'Dans quel canton se trouve cette ville ?', headline: now, explain: `${now} : canton ${deName(c.code)}. ${c.info}`,
        });
      },
    });
    if (ancient.includes(f)) add({
      ...meta(f, 'cia', 'names', 2),
      make(rng) {
        const correct = c.names[0][1]!;
        return mcq(this, rng, correct, distinct(ancient.map(x => x.city!.names[0][1]!), 3, rng, [correct]), {
          prompt: `Quel était le nom antique de ${now} ?`, explain: `${correct} (${fmtYear(c.names[0][0])}). ${c.info}`,
        });
      },
    });
    add({
      ...meta(f, 'cii', 'identify', 2),
      make(rng) {
        return mcq(this, rng, now, distinct(places.map(x => x.title), 3, rng, [now]), {
          prompt: 'De quelle ville parle-t-on ?', context: mask(c.info, c.names.map(n => n[1])), explain: c.info,
        });
      },
    });
  }

  /* ===== Traditions ===== */
  // seules les périodes qui citent un mois servent de réponse : on peut alors garantir des leurres sans recoupement
  const month = (s: string) => s.toLowerCase().match(/janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/g) ?? [];
  const whenPool = [...new Set(TRADITIONS.map(t => t.when).filter(w => month(w).length))];
  for (const f of trads) {
    const t = f.trad!;
    if (t.code) add({
      ...meta(f, 'trc', 'where', 1),
      make(rng) {
        return mcq(this, rng, NAMES[t.code!], wrongCantons([t.code!], rng), {
          prompt: 'Dans quel canton vit cette tradition ?', headline: t.title, explain: `${t.place}, canton ${deName(t.code!)}. ${t.text}`,
        });
      },
    });
    add({
      ...meta(f, 'trt', 'identify', 2),
      make(rng) {
        return mcq(this, rng, t.title, distinct(trads.map(x => x.title), 3, rng, [t.title]), {
          prompt: 'De quelle tradition parle-t-on ?', context: mask(t.text, [t.title, t.place]), explain: t.text,
        });
      },
    });
    if (whenPool.includes(t.when)) add({
      ...meta(f, 'trw', 'when', 2),
      make(rng) {
        const mine = new Set(month(t.when));
        const pool = whenPool.filter(w => w !== t.when && !month(w).some(m => mine.has(m)));
        return mcq(this, rng, t.when, distinct(pool, 3, rng, [t.when]), {
          prompt: 'Quand a-t-elle lieu ?', headline: t.title, explain: `${t.when}. ${t.text}`,
        });
      },
    });
    if (t.since) add({
      ...meta(f, 'trs', 'year', 3),
      make(rng) {
        const pool = trads.filter(x => x.year && x.year !== t.since).map(x => String(x.year));
        const near = [t.since! - 40, t.since! + 35, t.since! - 90].map(String);
        return mcq(this, rng, String(t.since), distinct([...pool, ...near], 3, rng, [String(t.since)]), {
          prompt: 'Depuis quand ?', headline: t.title, explain: t.text,
        });
      },
    });
  }

  /* ===== Peuples et seigneurs (portraits) ===== */
  for (const f of peoples) {
    if (f.id === 'pe-0-all') continue;
    const info = f.people!, ei = f.era, pe = PRE[ei];
    const pool = Object.values(pe.groups).map(g => g[0]);
    add({
      ...meta(f, 'peo', 'people', 2, { codes: f.codes.length <= 6 ? f.codes : [] }),
      make(rng) {
        return mcq(this, rng, f.title, distinct(pool, 3, rng, [f.title]), {
          prompt: 'Le saviez-vous ? De qui parle-t-on ?', context: mask(info.fact, [f.title, info.who]), explain: info.fact,
        });
      },
    });
    add({
      ...meta(f, 'por', 'people', 3, { codes: f.codes.length <= 6 ? f.codes : [] }),
      make(rng) {
        return mcq(this, rng, f.title, distinct(pool, 3, rng, [f.title]), {
          prompt: `Qui est représenté ? (${info.kind.toLowerCase()})`, portrait: f.portrait,
          context: mask(info.life, [f.title, info.who]).slice(0, 220) + '…', explain: `${info.who}. ${info.life}`,
        });
      },
    });
    add({
      ...meta(f, 'pee', 'year', 1, { codes: f.codes.length <= 6 ? f.codes : [] }),
      make(rng) {
        const wrong = distinct(ERAS.map(e => e.name).filter((_, i) => i !== ei && Math.abs(i - ei) <= 3), 3, rng);
        return mcq(this, rng, ERAS[ei].name, wrong, {
          prompt: 'À quelle époque ?', headline: `${f.title} · ${info.who}`, explain: `${ERAS[ei].name}. ${info.life}`,
        });
      },
    });
  }

  return F;
}

export const FACTORIES = buildFactories();
export const FACTORY_BY_ID = new Map(FACTORIES.map(f => [f.id, f]));
export const ERA_NAMES = ERAS.map(e => e.name);
