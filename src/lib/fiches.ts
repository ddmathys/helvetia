/* Fiches de lecture : chaque événement, ville, tradition et peuple devient une fiche illustrée.
   Les quiz (quiz/bank.ts) sont générés à partir de ces mêmes fiches. */
import traditionsJson from '../data/traditions.json';
import illusJson from '../data/illustrations.json';
import {
  ALL_CODES, CITIES, ERAS, EVENTS, NAMES, PEOPLES, PRE, TYPES, WAR,
  type CantonCode, type City, type HistEvent, type PeopleInfo, type PortraitParams,
} from './data';
import { cityNow } from './names';
import { eraOf, fmtYear } from './time';

export type Cat = 'evenement' | 'lieu' | 'tradition' | 'peuple';

export const CATS: Record<Cat, { label: string; plural: string; icon: string }> = {
  evenement: { label: 'Événement', plural: 'Événements', icon: '📜' },
  lieu: { label: 'Lieu', plural: 'Lieux', icon: '🏛️' },
  tradition: { label: 'Tradition', plural: 'Traditions', icon: '🎭' },
  peuple: { label: 'Peuple', plural: 'Peuples et seigneurs', icon: '🛡️' },
};

export interface Tradition {
  id: string; title: string; kind: string; code: CantonCode | null; place: string; lat?: number; lon?: number;
  when: string; since: number | null; wiki: string; text: string;
}

interface RawIllus { ref: string; page: string; url: string; extract?: string; file?: string; ratio?: number; artist?: string; license?: string; source?: string }

export interface Illustration { src: string; thumb: string; ratio: number; artist: string; license: string; source: string }

export interface Fiche {
  id: string;
  cat: Cat;
  title: string;
  /** Sous-titre court : « Bataille », « Ville », « Fête »… */
  kind: string;
  year: number | null;
  dateLabel: string;
  era: number;
  codes: CantonCode[];
  place: string;
  lat?: number;
  lon?: number;
  text: string;
  color: string;
  illus?: Illustration;
  portrait?: { fig: PortraitParams; bg: string };
  /** Pour aller plus loin : extrait de l'article Wikipédia */
  wiki?: { page: string; url: string; extract?: string };
  ev?: HistEvent;
  city?: City;
  trad?: Tradition;
  people?: PeopleInfo;
}

export const TRADITIONS = traditionsJson as Tradition[];
const ILLUS = illusJson as unknown as Record<string, RawIllus>;

function illusOf(id: string): Pick<Fiche, 'illus' | 'wiki'> {
  const r = ILLUS[id];
  if (!r) return {};
  return {
    wiki: { page: r.page, url: r.url, extract: r.extract },
    illus: r.file ? {
      src: `/img/f/${id}.webp`, thumb: `/img/f/${id}-s.webp`, ratio: r.ratio ?? 1.5,
      artist: r.artist ?? '', license: r.license ?? '', source: r.source ?? r.url,
    } : undefined,
  };
}

const placeOf = (codes: CantonCode[]) => (codes.length === 0 || codes.length >= 20 ? 'Toute la Suisse' : codes.length > 3 ? `${codes.length} cantons actuels` : codes.map(c => NAMES[c]).join(', '));

function build(): Fiche[] {
  const out: Fiche[] = [];

  for (const e of EVENTS) {
    const w = WAR[e.title];
    out.push({
      id: `ev${e.id}`, cat: 'evenement', title: e.title, kind: TYPES[e.type][0], year: e.year, dateLabel: fmtYear(e.year), era: eraOf(e.year),
      codes: [e.code], place: NAMES[e.code], lat: e.lat, lon: e.lon, text: e.text, color: TYPES[e.type][1], ev: e,
      ...illusOf(`ev${e.id}`),
      ...(w ? { kind: 'Bataille' } : {}),
    });
  }

  for (const c of CITIES) {
    const first = c.names.find(n => n[1]);
    const ancient = first && first[0] < 1000 ? first : null;
    out.push({
      id: `ci${c.id}`, cat: 'lieu', title: cityNow(c), kind: c.names.length > 1 && c.names[0][0] < 600 ? 'Ville antique' : 'Ville',
      year: ancient ? ancient[0] : null, dateLabel: ancient ? `Attestée vers ${fmtYear(ancient[0])}` : 'Ville d’aujourd’hui',
      era: ancient ? eraOf(ancient[0]) : 8, codes: [c.code], place: NAMES[c.code], lat: c.lat, lon: c.lon, text: c.info,
      color: '#9fc6e6', city: c, ...illusOf(`ci${c.id}`),
    });
  }

  for (const t of TRADITIONS) {
    const codes = t.code ? [t.code] : [];
    out.push({
      id: `tr-${t.id}`, cat: 'tradition', title: t.title, kind: t.kind, year: t.since, dateLabel: t.when,
      era: t.since ? eraOf(t.since) : 8, codes, place: t.code ? `${t.place} (${t.code})` : t.place, lat: t.lat, lon: t.lon,
      text: t.text, color: '#7fd6a4', trad: t, ...illusOf(`tr-${t.id}`),
    });
  }

  const PEOPLE_YEAR = [-5000, -100, 150, 700, 1200];
  for (const [k, info] of Object.entries(PEOPLES)) {
    const [eiS, key] = k.split(':');
    const ei = +eiS, pe = PRE[ei];
    const [label, color] = pe.groups[key] ?? [info.who, ERAS[ei].color];
    const codes = pe.map ? ALL_CODES.filter(c => pe.map![c] === key) : ALL_CODES;
    out.push({
      id: `pe-${ei}-${key}`, cat: 'peuple', title: label, kind: info.kind, year: PEOPLE_YEAR[ei], dateLabel: ERAS[ei].name, era: ei,
      codes, place: placeOf(codes), text: info.life, color, portrait: { fig: info.fig, bg: color }, people: info,
    });
  }

  return out;
}

export const FICHES = build();
export const FICHE_BY_ID = new Map(FICHES.map(f => [f.id, f]));

/** Minuscules sans accents, pour la recherche. */
export const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const haystack = new Map(FICHES.map(f => [f.id, norm([f.title, f.kind, f.place, f.dateLabel, f.text, ...f.codes.map(c => NAMES[c])].join(' '))]));
export function searchFiches(q: string, list = FICHES): Fiche[] {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list.filter(f => words.every(w => haystack.get(f.id)!.includes(w)));
}

/** Fiches voisines : même canton, puis proximité dans le temps. */
export function relatedFiches(f: Fiche, n = 6): Fiche[] {
  return FICHES.filter(o => o.id !== f.id)
    .map(o => {
      const shared = o.codes.some(c => f.codes.includes(c)) && o.codes.length < 20 && f.codes.length < 20;
      const dt = f.year !== null && o.year !== null ? Math.abs(f.year - o.year) : 400;
      const score = (shared ? 0 : 600) + Math.min(dt, 800) + (o.cat === f.cat ? 0 : 60) + (o.era === f.era ? 0 : 120);
      return { o, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map(x => x.o);
}

/** Fiche du jour : la même pour tout le monde, parmi les fiches illustrées. */
export function ficheOfDay(key: string): Fiche {
  const pool = FICHES.filter(f => f.illus || f.portrait);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

/** Tri chronologique (les traditions sans date en fin). */
export const byYear = (a: Fiche, b: Fiche) => (a.year ?? 3000) - (b.year ?? 3000) || a.title.localeCompare(b.title, 'fr');
