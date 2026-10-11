/* Banque de questions générée à partir des fiches (spec §9 étape 5 : chaque fiche → plusieurs questions).
   Chaque « fabrique » produit une question avec des leurres tirés au sort (graine contrôlée). */
import { geoContains } from 'd3';
import {
  ALL_CODES, CINFO, CITIES, COUNT, ERAS, EVENTS, LAKES, NAMES, PEAKS, PEOPLES, POP, PRE, ST, TL, WAR, deName,
  type CantonCode, type HistEvent, type PortraitParams,
} from '../lib/data';
import { cantonFeatures, countryFeature } from '../lib/geo';
import { cityNow } from '../lib/names';
import { fmtPop } from '../lib/population';
import { joinYear, statusAt } from '../lib/territories';
import { eraOf, fmtYear } from '../lib/time';
import type { Selection } from '../map/AtlasMap';
import { distinct, pick, shuffle, type Rng } from './rng';

export type Diff = 1 | 2 | 3;

export interface Question {
  id: string;
  kind: string;
  mode: 'mcq' | 'map';
  prompt: string;
  headline?: string;
  context?: string;
  portrait?: { fig: PortraitParams; bg: string };
  choices: string[];
  answer: number;
  /** Questions carte : canton(s) accepté(s) */
  accept?: CantonCode[];
  target?: CantonCode;
  codes: CantonCode[];
  era: number;
  diff: Diff;
  explain: string;
  see?: { sel: Selection; year: number };
}

export interface Factory {
  id: string;
  kind: string;
  family: string;
  subject: string;
  codes: CantonCode[];
  era: number;
  diff: Diff;
  make: (rng: Rng) => Question | null;
}

type Base = Omit<Question, 'choices' | 'answer' | 'mode' | 'id' | 'kind' | 'codes' | 'era' | 'diff'>;

function mcq(f: Pick<Factory, 'id' | 'kind' | 'codes' | 'era' | 'diff'>, rng: Rng, correct: string, wrong: string[], base: Base): Question | null {
  if (wrong.length < 1) return null;
  const choices = shuffle([correct, ...wrong], rng);
  return { ...base, id: f.id, kind: f.kind, codes: f.codes, era: f.era, diff: f.diff, mode: 'mcq', choices, answer: choices.indexOf(correct) };
}

/** Masque les noms propres d'un texte (pour « de qui / de quoi parle-t-on ? »). */
function mask(text: string, names: (string | null)[]): string {
  let t = text;
  for (const n of names) {
    if (!n) continue;
    for (const w of n.split(/[\s’',()-]+/).filter(w => w.length >= 4 && !/^(Lac|lac|ville|Comtes|Abbé|Évêque|Prince|Peuples|Hautes|vallées|puis)$/.test(w))) {
      const stem = w.slice(0, Math.max(4, w.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`${stem}[\\p{L}]*`, 'giu'), '…');
    }
  }
  return t;
}

/** Événements localisables sur la carte suisse (Marignan s'est joué en Lombardie : point de repère seulement). */
const OUTSIDE = new Set(['Marignan']);
const insideCH = (e: { lat: number; lon: number; title?: string }) => !OUTSIDE.has(e.title ?? '') && geoContains(countryFeature, [e.lon, e.lat]);
const cantonAt = (lat: number, lon: number) => cantonFeatures.find(f => geoContains(f, [lon, lat]))?.code;

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

const evSee = (e: HistEvent) => ({ sel: { kind: 'event' as const, id: e.id }, year: e.year });
const cantonSee = (code: CantonCode, year = 2026) => ({ sel: { kind: 'canton' as const, code }, year });

function buildFactories(): Factory[] {
  const F: Factory[] = [];
  const add = (f: Factory) => F.push(f);

  /* ===== Événements ===== */
  const warNames = [...new Set(Object.values(WAR).map(w => w[0]))];
  for (const e of EVENTS) {
    const era = eraOf(e.year);
    const codes = [e.code];
    // En quelle année ?
    add({
      id: `evy:${e.id}`, kind: 'evy', family: 'year', subject: `ev${e.id}`, codes, era, diff: e.lvl === 1 ? 1 : 2,
      make(rng) {
        const pool = EVENTS.filter(x => Math.abs(eraOf(x.year) - era) <= 1 && x.year !== e.year).map(x => x.year);
        const extra = [-1, 1, -2, 2].map(k => e.year + k * (era <= 2 ? 150 : era <= 4 ? 60 : 17));
        const wrong = distinct([...pool, ...extra].filter(y => y !== e.year && y >= -15000 && y <= 2026), 3, rng).map(fmtYear);
        return mcq(this, rng, fmtYear(e.year), wrong, { prompt: 'En quelle année ?', headline: e.title, explain: e.text, see: evSee(e) });
      },
    });
    // Quel événement ? (description masquée)
    add({
      id: `evt:${e.id}`, kind: 'evt', family: 'identify', subject: `ev${e.id}`, codes, era, diff: e.lvl === 1 ? 2 : 3,
      make(rng) {
        const pool = EVENTS.filter(x => x.id !== e.id && Math.abs(eraOf(x.year) - era) <= 1).map(x => x.title);
        const wrong = distinct(pool, 3, rng, [e.title]);
        return mcq(this, rng, e.title, wrong, {
          prompt: `De quel événement parle-t-on ? (${fmtYear(e.year)})`, context: mask(e.text, [e.title]), explain: e.text, see: evSee(e),
        });
      },
    });
    // Sur la carte
    if (insideCH(e)) {
      const accept = [...new Set([e.code, cantonAt(e.lat, e.lon)].filter(Boolean) as CantonCode[])];
      add({
        id: `evm:${e.id}`, kind: 'evm', family: 'map', subject: `ev${e.id}`, codes, era, diff: e.lvl === 1 ? 2 : 3,
        make() {
          return {
            id: this.id, kind: this.kind, codes, era, diff: this.diff, mode: 'map', choices: [], answer: -1, accept, target: e.code,
            prompt: 'Touche le canton actuel où cela s’est passé', headline: `${fmtYear(e.year)} · ${e.title}`, explain: e.text, see: evSee(e),
          };
        },
      });
    }
    // Lequel d'abord ?
    if (e.lvl === 1) {
      add({
        id: `evo:${e.id}`, kind: 'evo', family: 'order', subject: `ev${e.id}`, codes, era, diff: 2,
        make(rng) {
          const other = pick(EVENTS.filter(x => x.lvl === 1 && Math.abs(x.year - e.year) >= 5 && Math.abs(eraOf(x.year) - era) <= 1), rng);
          if (!other) return null;
          const first = e.year < other.year ? e : other, second = first === e ? other : e;
          return mcq(this, rng, first.title, [second.title], {
            prompt: 'Lequel s’est produit en premier ?',
            explain: `${first.title} : ${fmtYear(first.year)}. ${second.title} : ${fmtYear(second.year)}.`, see: evSee(first),
          });
        },
      });
    }
    // Batailles
    const w = WAR[e.title];
    if (w) {
      add({
        id: `batw:${e.id}`, kind: 'batw', family: 'war', subject: `ev${e.id}`, codes, era, diff: 2,
        make(rng) {
          return mcq(this, rng, w[0], distinct(warNames, 3, rng, [w[0]]), {
            prompt: 'De quelle guerre fait partie cette bataille ?', headline: `${e.title} (${fmtYear(e.year)})`,
            explain: `${w[0]} : ${w[1]} contre ${w[2]}. Vainqueur : ${w[3]}.`, see: evSee(e),
          });
        },
      });
      const side = WINNER[e.title];
      if (side) {
        add({
          id: `batv:${e.id}`, kind: 'batv', family: 'war', subject: `ev${e.id}`, codes, era, diff: 1,
          make(rng) {
            return mcq(this, rng, side === 'A' ? w[1] : w[2], [side === 'A' ? w[2] : w[1]], {
              prompt: 'Qui l’a emporté ?', headline: `${e.title} (${fmtYear(e.year)})`, explain: `Vainqueur : ${w[3]}. ${e.text}`, see: evSee(e),
            });
          },
        });
      }
    }
  }

  /* ===== Cantons aujourd'hui ===== */
  const langKey = (l: string) => l.toLowerCase().split(/,\s*/).sort().join('|');
  const caps = ALL_CODES.map(c => CINFO[c].cap);
  for (const code of ALL_CODES) {
    const ci = CINFO[code], name = NAMES[code], codes = [code];
    const small = ci.km2 < 500;
    const others = ALL_CODES.filter(c => c !== code);
    add({
      id: `loc:${code}`, kind: 'loc', family: 'map', subject: `c${code}`, codes, era: 8, diff: small ? 2 : 1,
      make() {
        return {
          id: this.id, kind: this.kind, codes, era: 8, diff: this.diff, mode: 'map', choices: [], answer: -1, accept: [code], target: code,
          prompt: 'Touche ce canton sur la carte', headline: `Canton ${deName(code)}`, explain: `Chef-lieu : ${ci.cap}. ${ci.km2.toLocaleString('fr-CH')} km², ${ci.pop.toLocaleString('fr-CH')} habitants.`, see: cantonSee(code),
        };
      },
    });
    if (ci.cap !== name) add({
      id: `cap:${code}`, kind: 'cap', family: 'canton', subject: `c${code}`, codes, era: 8, diff: 1,
      make(rng) {
        return mcq(this, rng, ci.cap, distinct(caps, 3, rng, [ci.cap, name]), {
          prompt: `Quel est le chef-lieu du canton ${deName(code)} ?`, explain: `${ci.cap} est le chef-lieu du canton ${deName(code)}.`, see: cantonSee(code),
        });
      },
    });
    const byName = (field: 'food' | 'trad' | 'people', prompt: string, diff: Diff) => {
      if (ci[field] === '—') return;
      add({
        id: `${field}:${code}`, kind: field, family: 'canton', subject: `c${code}`, codes, era: 8, diff,
        make(rng) {
          return mcq(this, rng, name, distinct(others, 3, rng).map(c => NAMES[c]), {
            prompt, headline: `« ${mask(ci[field], [name, ci.cap])} »`, explain: `Canton ${deName(code)} : ${ci[field]}.`, see: cantonSee(code),
          });
        },
      });
    };
    byName('food', 'De quel canton est cette spécialité ?', 2);
    byName('trad', 'Dans quel canton vit cette tradition ?', 2);
    byName('people', 'À quel canton associe-t-on ces figures ?', 3);
    add({
      id: `lang:${code}`, kind: 'lang', family: 'canton', subject: `c${code}`, codes, era: 8, diff: 1,
      make(rng) {
        const pool = ALL_CODES.map(c => CINFO[c].lang).filter(l => langKey(l) !== langKey(ci.lang));
        return mcq(this, rng, ci.lang, distinct(pool, 3, rng, [], langKey), {
          prompt: `Quelle(s) langue(s) parle-t-on officiellement dans le canton ${deName(code)} ?`, explain: `Canton ${deName(code)} : ${ci.lang}.`, see: cantonSee(code),
        });
      },
    });
    const jy = code === 'JU' ? 1979 : joinYear(code);
    add({
      id: `join:${code}`, kind: 'join', family: 'year', subject: `c${code}`, codes, era: eraOf(jy), diff: jy === 1291 || jy === 1848 ? 1 : 2,
      make(rng) {
        const pool = ALL_CODES.map(c => (c === 'JU' ? 1979 : joinYear(c))).filter(y => y !== jy);
        const wrong = distinct([...pool, jy + 30, jy - 25], 3, rng, [jy]).map(String);
        return mcq(this, rng, String(jy), wrong, {
          prompt: `En quelle année le territoire de l’actuel canton ${deName(code)} devient-il membre de la Confédération ?`,
          explain: code === 'JU' ? 'Le Jura se sépare de Berne et devient le 23ᵉ canton en 1979.' : `Membre dès ${jy} : ${TL[code].find(s => s[1] === 'membre')![2]}.`,
          see: cantonSee(code, jy),
        });
      },
    });
    add({
      id: `cmp:${code}`, kind: 'cmp', family: 'compare', subject: `c${code}`, codes, era: 8, diff: 2,
      make(rng) {
        const byPop = rng() < 0.5;
        const o = pick(others.filter(c => {
          const a = byPop ? CINFO[c].pop : CINFO[c].km2, b = byPop ? ci.pop : ci.km2;
          return Math.max(a, b) / Math.min(a, b) > 1.25;
        }), rng);
        const v = (c: CantonCode) => (byPop ? CINFO[c].pop : CINFO[c].km2);
        const win = v(code) > v(o) ? code : o, lose = win === code ? o : code;
        const f = (c: CantonCode) => (byPop ? `${CINFO[c].pop.toLocaleString('fr-CH')} hab.` : `${CINFO[c].km2.toLocaleString('fr-CH')} km²`);
        return mcq(this, rng, NAMES[win], [NAMES[lose]], {
          prompt: byPop ? 'Lequel est le plus peuplé ?' : 'Lequel est le plus grand ?',
          explain: `${NAMES[win]} : ${f(win)} · ${NAMES[lose]} : ${f(lose)}.`, see: cantonSee(win),
        });
      },
    });
    // Statut et maître à une date (1291–1797)
    const periods = TL[code].map((s, i) => ({ s, from: s[0], to: Math.min(1797, (TL[code][i + 1]?.[0] ?? 2026) - 1) })).filter(p => p.from < 1798 && p.to >= p.from);
    if (periods.length) {
      add({
        id: `stat:${code}`, kind: 'stat', family: 'status', subject: `c${code}`, codes, era: 6, diff: 3,
        make(rng) {
          const p = pick(periods, rng);
          const y = Math.round(p.from + rng() * (p.to - p.from));
          const s = statusAt(code, y)!;
          const labels = (['membre', 'allie', 'sujet', 'etranger'] as const).map(k => ST[k][0]);
          return mcq({ ...this, era: eraOf(y) }, rng, ST[s[1]][0], labels.filter(l => l !== ST[s[1]][0]), {
            prompt: `En ${y}, quel est le statut du territoire de l’actuel canton ${deName(code)} ?`,
            explain: `En ${y} : ${s[2]} (${ST[s[1]][0].toLowerCase()}).`, see: cantonSee(code, y),
          });
        },
      });
    }
    // Avant 1291 : peuples et seigneurs
    for (let i = 1; i < PRE.length; i++) {
      const pe = PRE[i], key = pe.map![code], label = pe.groups[key][0];
      const yr = [0, -100, 150, 700, 1200][i];
      const verb = ['', 'quel peuple vit sur', 'quelle province romaine couvre', 'quel peuple s’installe sur', 'qui domine'][i];
      add({
        id: `pre:${i}:${code}`, kind: 'pre', family: 'pre', subject: `pre${i}${key}`, codes, era: i, diff: i === 4 ? 3 : 2,
        make(rng) {
          const pool = Object.values(pe.groups).map(g => g[0]);
          return mcq(this, rng, label, distinct(pool, 3, rng, [label]), {
            prompt: `Vers ${fmtYear(yr)}, ${verb} le territoire de l’actuel canton ${deName(code)} ?`,
            explain: `${label}. ${pe.note}`, see: cantonSee(code, yr),
          });
        },
      });
    }
  }

  /* ===== Peuples et seigneuries (fiches illustrées) ===== */
  for (const [k, info] of Object.entries(PEOPLES)) {
    const [eiS, key] = k.split(':');
    const ei = +eiS;
    if (key === 'all') continue;
    const pe = PRE[ei], [label, color] = pe.groups[key];
    const codes = ALL_CODES.filter(c => pe.map![c] === key);
    const pool = Object.values(pe.groups).map(g => g[0]);
    add({
      id: `peo:${k}`, kind: 'peo', family: 'pre', subject: `pre${ei}${key}`, codes, era: ei, diff: 2,
      make(rng) {
        return mcq(this, rng, label, distinct(pool, 3, rng, [label]), {
          prompt: 'Le saviez-vous ? De qui parle-t-on ?', context: mask(info.fact, [label, info.who]), explain: info.fact,
          see: { sel: { kind: 'canton', code: codes[0] }, year: [0, -100, 150, 700, 1200][ei] },
        });
      },
    });
    add({
      id: `por:${k}`, kind: 'por', family: 'pre', subject: `pre${ei}${key}`, codes, era: ei, diff: 3,
      make(rng) {
        return mcq(this, rng, label, distinct(pool, 3, rng, [label]), {
          prompt: `Qui est représenté ? (${info.kind.toLowerCase()})`, portrait: { fig: info.fig, bg: color },
          context: mask(info.life, [label, info.who]).slice(0, 220) + '…',
          explain: `${info.who}. ${info.life}`, see: { sel: { kind: 'canton', code: codes[0] }, year: [0, -100, 150, 700, 1200][ei] },
        });
      },
    });
  }

  /* ===== Villes ===== */
  const ancient = CITIES.filter(c => c.names.length >= 2 && c.names[0][1] && c.names[0][0] < 600);
  const MAJOR = new Set(['Genève', 'Zurich', 'Berne', 'Bâle', 'Lausanne', 'Lugano', 'Lucerne', 'Saint-Gall']);
  for (const c of CITIES) {
    const now = cityNow(c), codes = [c.code];
    const see = { sel: { kind: 'city' as const, id: c.id }, year: Math.max(c.names[0][0], 2026) };
    if (c.names[c.names.length - 1][1]) add({
      id: `cim:${c.id}`, kind: 'cim', family: 'map', subject: `ci${c.id}`, codes, era: 8, diff: MAJOR.has(now) ? 1 : 2,
      make() {
        return {
          id: this.id, kind: this.kind, codes, era: 8, diff: this.diff, mode: 'map', choices: [], answer: -1, accept: [c.code], target: c.code,
          prompt: 'Dans quel canton se trouve cette ville ? Touche-le.', headline: now, explain: c.info, see,
        };
      },
    });
    if (ancient.includes(c)) add({
      id: `cia:${c.id}`, kind: 'cia', family: 'names', subject: `ci${c.id}`, codes, era: eraOf(c.names[0][0]), diff: 2,
      make(rng) {
        const correct = c.names[0][1]!;
        return mcq(this, rng, correct, distinct(ancient.map(x => x.names[0][1]!), 3, rng, [correct]), {
          prompt: `Quel était le nom antique de ${now} ?`, explain: `${correct} (${fmtYear(c.names[0][0])}). ${c.info}`, see,
        });
      },
    });
    add({
      id: `cii:${c.id}`, kind: 'cii', family: 'identify', subject: `ci${c.id}`, codes, era: 8, diff: 2,
      make(rng) {
        return mcq(this, rng, now, distinct(CITIES.map(cityNow), 3, rng, [now]), {
          prompt: 'De quelle ville parle-t-on ?', context: mask(c.info, c.names.map(n => n[1])), explain: c.info, see,
        });
      },
    });
  }

  /* ===== Lacs ===== */
  const lakes = Object.entries(LAKES).map(([id, L]) => ({ id: +id, L, now: L.names[L.names.length - 1][1] }));
  for (const { id, L, now } of lakes) {
    const see = { sel: { kind: 'lake' as const, id }, year: 2026 };
    if (L.names.length >= 2 && L.names[0][0] < 1000) add({
      id: `lal:${id}`, kind: 'lal', family: 'names', subject: `l${id}`, codes: [], era: 2, diff: 2,
      make(rng) {
        return mcq(this, rng, now, distinct(lakes.map(x => x.now), 3, rng, [now]), {
          prompt: `Quel lac les Romains appelaient-ils ${L.names[0][1]} ?`, explain: L.note, see,
        });
      },
    });
    add({
      id: `lan:${id}`, kind: 'lan', family: 'identify', subject: `l${id}`, codes: [], era: 8, diff: 2,
      make(rng) {
        return mcq(this, rng, now, distinct(lakes.map(x => x.now), 3, rng, [now]), {
          prompt: 'De quel lac parle-t-on ?', context: mask(L.note, L.names.map(n => n[1])), explain: L.note, see,
        });
      },
    });
    add({
      id: `lak:${id}`, kind: 'lak', family: 'compare', subject: `l${id}`, codes: [], era: 8, diff: 2,
      make(rng) {
        const o = pick(lakes.filter(x => x.id !== id && Math.max(x.L.km2, L.km2) / Math.min(x.L.km2, L.km2) > 1.3), rng);
        const win = o.L.km2 > L.km2 ? o : { id, L, now }, lose = win.id === id ? o : { id, L, now };
        return mcq(this, rng, win.now, [lose.now], {
          prompt: 'Lequel est le plus grand ?', explain: `${win.now} : ${win.L.km2} km² · ${lose.now} : ${lose.L.km2} km².`, see,
        });
      },
    });
  }

  /* ===== Sommets, population, cantons dans le temps ===== */
  PEAKS.forEach((p, i) => add({
    id: `pk:${i}`, kind: 'pk', family: 'compare', subject: `pk${i}`, codes: [], era: 8, diff: 1,
    make(rng) {
      const o = pick(PEAKS.filter(x => x !== p), rng);
      const alt = (x: typeof p) => parseInt(x[3]);
      const win = alt(p) > alt(o) ? p : o, lose = win === p ? o : p;
      return mcq(this, rng, win[2], [lose[2]], { prompt: 'Lequel est le plus haut ?', explain: `${win[2]} : ${win[3]} · ${lose[2]} : ${lose[3]}.` });
    },
  }));
  POP.filter(p => p[2] === 'real').forEach(([y, n]) => add({
    id: `pop:${y}`, kind: 'pop', family: 'pop', subject: `pop${y}`, codes: [], era: eraOf(y), diff: y >= 2000 ? 1 : 3,
    make(rng) {
      const pool = POP.filter(p => p[0] !== y && p[1] > 300000).map(p => fmtPop(p[1]));
      return mcq(this, rng, fmtPop(n), distinct(pool, 3, rng, [fmtPop(n)]), {
        prompt: y === 2025 ? 'Combien d’habitants compte la Suisse fin 2025 ?' : `Combien d’habitants compte la Suisse au recensement de ${y} ?`,
        explain: `${n.toLocaleString('fr-CH')} habitants${y === 2025 ? ' (OFS, 31.12.2025)' : ''}.`, see: { sel: null, year: y },
      });
    },
  }));
  COUNT.forEach(([y, label], i) => {
    if (label === '1 république') return;
    const next = COUNT[i + 1]?.[0] ?? 2026;
    add({
      id: `cnt:${y}`, kind: 'cnt', family: 'status', subject: `cnt${y}`, codes: [], era: eraOf(y), diff: y >= 1979 ? 1 : 3,
      make(rng) {
        const yy = Math.round(y + rng() * (next - 1 - y));
        return mcq({ ...this, era: eraOf(yy) }, rng, label, distinct(COUNT.map(c => c[1]).filter(l => l !== '1 république'), 3, rng, [label]), {
          prompt: `En ${yy}, combien de cantons compte la Confédération ?`, explain: `Depuis ${y} : ${label}.`, see: { sel: null, year: yy },
        });
      },
    });
  });

  return F;
}

export const FACTORIES = buildFactories();
export const FACTORY_BY_ID = new Map(FACTORIES.map(f => [f.id, f]));

/** Événements nationaux utilisables pour Chrono-Géo (situés en Suisse). */
export const CHRONO_EVENTS = EVENTS.filter(e => e.lvl === 1 && insideCH(e));

export const ERA_NAMES = ERAS.map(e => e.name);
