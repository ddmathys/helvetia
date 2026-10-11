import type { CantonCode } from '../lib/data';
import { FACTORIES, FACTORY_BY_ID, type Factory, type Question } from './bank';
import { mulberry32, type Rng } from './rng';

export type ModeId = 'quick' | 'era' | 'canton' | 'exam' | 'daily' | 'survival' | 'review' | 'chrono';

export interface QuizConfig { mode: ModeId; era?: number; code?: CantonCode; seed?: number }

export const MODE_LEN: Record<ModeId, number> = { quick: 10, era: 10, canton: 10, exam: 30, daily: 10, survival: 80, review: 10, chrono: 8 };
/** Secondes par question (0 = sans chrono) */
export const MODE_TIMER: Record<ModeId, number> = { quick: 20, era: 25, canton: 25, exam: 0, daily: 20, survival: 15, review: 0, chrono: 0 };

function candidates(cfg: QuizConfig, missed: string[]): Factory[] {
  switch (cfg.mode) {
    case 'era': return FACTORIES.filter(f => f.era === cfg.era);
    case 'canton': return FACTORIES.filter(f => cfg.code && f.codes.length <= 6 && f.codes.includes(cfg.code));
    case 'review': return missed.map(id => FACTORY_BY_ID.get(id)).filter(Boolean) as Factory[];
    default: return FACTORIES;
  }
}

/** Poids selon le niveau du joueur : les débutants voient plus de questions faciles. */
function weight(f: Factory, cfg: QuizConfig, rank: number): number {
  if (cfg.mode === 'exam' || cfg.mode === 'daily') return f.diff === 2 ? 3 : 2;
  if (cfg.mode === 'canton') return f.codes.length === 1 ? 3 : 1;
  const r = Math.min(rank, 9);
  return f.diff === 1 ? Math.max(1, 5 - r * 0.6) : f.diff === 2 ? 3 : 0.6 + r * 0.45;
}

export function buildQuiz(cfg: QuizConfig, opts: { rank: number; missed: string[] }): Question[] {
  const rng: Rng = mulberry32(cfg.seed ?? Math.floor(Math.random() * 2 ** 31));
  const n = MODE_LEN[cfg.mode];
  const pool = candidates(cfg, opts.missed)
    .map(f => ({ f, k: Math.pow(rng(), 1 / weight(f, cfg, opts.rank)) }))
    .sort((a, b) => b.k - a.k)
    .map(x => x.f);
  const out: Question[] = [];
  const subjects = new Set<string>();
  const fam = new Map<string, number>();
  const cap = cfg.mode === 'canton' || cfg.mode === 'era' ? Math.ceil(n / 2) : Math.ceil(n / 4);
  for (const relax of [false, true]) {
    for (const f of pool) {
      if (out.length >= n) break;
      if (out.some(q => q.id === f.id)) continue;
      if (!relax && (subjects.has(f.subject) || (fam.get(f.family) ?? 0) >= cap)) continue;
      const q = f.make(rng);
      if (!q) continue;
      out.push(q);
      subjects.add(f.subject);
      fam.set(f.family, (fam.get(f.family) ?? 0) + 1);
    }
  }
  if (cfg.mode === 'survival') out.sort((a, b) => a.diff - b.diff || rng() - 0.5);
  return spread(out);
}

const familyOf = (q: Question) => FACTORY_BY_ID.get(q.id)?.family ?? q.kind;

/** Réordonne pour éviter deux questions de même famille (ex. deux cartes) d'affilée, quand c'est possible. */
function spread(qs: Question[]): Question[] {
  const rest = qs.slice(), out: Question[] = [];
  while (rest.length) {
    const prev = out.length ? familyOf(out[out.length - 1]) : null;
    const i = rest.findIndex(q => familyOf(q) !== prev);
    out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}
