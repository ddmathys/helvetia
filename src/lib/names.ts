import { LAKES, type City } from './data';

/** Nom d'une ville à une date ; null si elle n'existe pas encore (ou plus). */
export function cityName(c: City, y: number): string | null {
  let n: string | null = null;
  for (const [a, nm] of c.names) if (y >= a) n = nm;
  return n;
}

/** Nom actuel (ou dernier nom connu) d'une ville. */
export const cityNow = (c: City) => c.names[c.names.length - 1][1] || c.names[0][1]!;

/** Nom d'un lac à une date, seulement après sa première attestation (spec §4.8). */
export function lakeName(id: number | string, y: number): string | null {
  const L = LAKES[id];
  if (!L) return null;
  let n: string | null = null;
  for (const [a, nm] of L.names) if (y >= a) n = nm;
  return n;
}
