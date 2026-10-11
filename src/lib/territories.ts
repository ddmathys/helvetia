import { PRE, TL, ST, COUNT, type CantonCode, type PreEra, type Status, type TimelineEntry } from './data';

/** Statut d'un canton actuel à une date (dès 1291), ou null avant. */
export function statusAt(code: CantonCode, y: number): TimelineEntry | null {
  let cur: TimelineEntry | null = null;
  for (const s of TL[code]) if (y >= s[0]) cur = s;
  return cur;
}

export interface PreGroup { key: string; label: string; color: string; era: PreEra; eraIndex: number }

/** Groupe (peuple, province, seigneur) d'un canton actuel avant 1291. */
export function preAt(code: CantonCode, y: number): PreGroup | null {
  const i = PRE.findIndex(p => y >= p.from && y < p.to);
  if (i < 0) return null;
  const e = PRE[i];
  if (e.groups.all) return { key: 'all', label: e.groups.all[0], color: e.groups.all[1], era: e, eraIndex: i };
  const k = e.map![code];
  return { key: k, label: e.groups[k][0], color: e.groups[k][1], era: e, eraIndex: i };
}

export interface Entity { key: string; label: string; fill: string; status: Status | null }

/** Entité à laquelle appartient un canton actuel : même clé ⇒ géométries fusionnées (spec §4.2). */
export function entityOf(code: CantonCode, y: number): Entity {
  if (y < 1291) {
    const p = preAt(code, y)!;
    return { key: 'p|' + p.key, label: p.key === 'all' ? '' : p.label, fill: p.color, status: null };
  }
  const s = statusAt(code, y)!;
  return { key: s[1] + '|' + s[2], label: s[2], fill: fillFor(s[1]), status: s[1] };
}

export const fillFor = (s: Status) => (s === 'allie' ? 'url(#h-allie)' : s === 'sujet' ? 'url(#h-sujet)' : ST[s][2]);

/** Étiquette courte : coupée avant « ( » ou « , ». */
export const shortLabel = (l: string) => l.split(/ \(|, /)[0];

export function countAt(y: number): string | null {
  const c = COUNT.filter(r => y >= r[0]).at(-1);
  return c ? c[1] : null;
}

/** Année d'entrée comme membre (première entrée « membre » de la frise). */
export function joinYear(code: CantonCode): number {
  return TL[code].find(s => s[1] === 'membre')![0];
}
