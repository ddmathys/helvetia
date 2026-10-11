/** Interpolation log-linéaire entre points [année, valeur] ; null avant le premier point, dernière valeur au-delà (spec §4.5). */
export function interpLog(T: readonly (readonly [number, number, ...unknown[]])[], y: number): number | null {
  if (y < T[0][0]) return null;
  for (let i = 0; i < T.length - 1; i++) {
    const [a, va] = T[i], [b, vb] = T[i + 1];
    if (y <= b) {
      const t = (y - a) / (b - a);
      return Math.exp(Math.log(va) + (Math.log(vb) - Math.log(va)) * t);
    }
  }
  return T[T.length - 1][1];
}

/** « 1,2 M » ou « 815 000 ». */
export function fmtPop(n: number): string {
  return n >= 1e6
    ? (n / 1e6).toLocaleString('fr-CH', { maximumFractionDigits: 2 }) + ' M'
    : Math.round(n / 1000).toLocaleString('fr-CH') + ' 000';
}

export const fmtN = (n: number) => n.toLocaleString('fr-CH');

export function reliability(y: number): { label: string; real: boolean } {
  if (y >= 1798) return { label: 'recensement', real: true };
  return { label: y < 1000 ? 'estimation, ordre de grandeur' : 'estimation d’historiens', real: false };
}
