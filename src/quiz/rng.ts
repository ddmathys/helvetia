export type Rng = () => number;

/** Générateur déterministe (mulberry32) : même graine ⇒ même partie (défi du jour). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seedFrom = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

/** n éléments distincts de pool, différents de exclude (comparaison par clé). */
export function distinct<T>(pool: T[], n: number, rng: Rng, exclude: T[] = [], key: (x: T) => string = x => String(x)): T[] {
  const seen = new Set(exclude.map(key));
  const out: T[] = [];
  for (const x of shuffle(pool, rng)) {
    const k = key(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length === n) break;
  }
  return out;
}

export const todayKey = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }); // AAAA-MM-JJ
