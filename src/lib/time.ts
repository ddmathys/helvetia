import { BP, PC } from './data';

export const MIN_YEAR = -15000;
export const MAX_YEAR = 2026;

/** Année → position sur la barre (0–100 %), échelle déformée par époque (spec §4.1). */
export function posOf(y: number): number {
  y = Math.max(BP[0], Math.min(MAX_YEAR, y));
  for (let i = 0; i < BP.length - 1; i++) if (y <= BP[i + 1]) return PC[i] + ((y - BP[i]) / (BP[i + 1] - BP[i])) * (PC[i + 1] - PC[i]);
  return 100;
}

/** Position (0–100 %) → année entière. */
export function yearOf(p: number): number {
  p = Math.max(0, Math.min(100, p));
  for (let i = 0; i < PC.length - 1; i++) if (p <= PC[i + 1]) return Math.round(BP[i] + ((p - PC[i]) / (PC[i + 1] - PC[i])) * (BP[i + 1] - BP[i])) + 0; // + 0 : évite -0
  return MAX_YEAR;
}

/** Index de l'époque (0–8). */
export function eraOf(y: number): number {
  for (let i = 0; i < BP.length - 1; i++) if (y < BP[i + 1]) return i;
  return BP.length - 2;
}

/** « 5 000 av. J.-C. » ou « 1291 ». */
export function fmtYear(y: number): string {
  return y < 0 ? `${Math.abs(y).toLocaleString('fr-CH')} av. J.-C.` : `${y}`;
}

/** Version courte pour les listes : « 58 av. » */
export function fmtYearShort(y: number): string {
  return y < 0 ? `${Math.abs(y)} av.` : `${y}`;
}
