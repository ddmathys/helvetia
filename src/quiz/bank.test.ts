import { describe, expect, it } from 'vitest';
import { FACTORIES, CHRONO_EVENTS } from './bank';
import { buildQuiz, MODE_LEN, type ModeId } from './sampler';
import { mulberry32 } from './rng';
import { ALL_CODES, ERAS } from '../lib/data';

describe('banque de questions', () => {
  it('chaque fabrique produit une question valide', () => {
    const bad: string[] = [];
    for (let seed = 1; seed <= 5; seed++) {
      const rng = mulberry32(seed);
      for (const f of FACTORIES) {
        const q = f.make(rng);
        if (!q) { bad.push(`${f.id}: null`); continue; }
        if (q.mode === 'mcq') {
          if (q.choices.length < 2) bad.push(`${f.id}: ${q.choices.length} choix`);
          if (new Set(q.choices).size !== q.choices.length) bad.push(`${f.id}: doublon ${q.choices.join(' / ')}`);
          if (q.answer < 0 || q.answer >= q.choices.length) bad.push(`${f.id}: réponse hors bornes`);
        } else if (!q.accept?.length) bad.push(`${f.id}: carte sans réponse`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('volumes', () => {
    const byKind: Record<string, number> = {};
    FACTORIES.forEach(f => (byKind[f.kind] = (byKind[f.kind] ?? 0) + 1));
    const byEra = ERAS.map((_, i) => FACTORIES.filter(f => f.era === i).length);
    console.log('fabriques', FACTORIES.length, byKind, 'par époque', byEra, 'chrono', CHRONO_EVENTS.length);
    expect(FACTORIES.length).toBeGreaterThan(600);
    for (const n of byEra) expect(n).toBeGreaterThanOrEqual(10);
  });

  it('chaque mode remplit sa partie', () => {
    const modes: ModeId[] = ['quick', 'exam', 'daily', 'survival'];
    for (const mode of modes) expect(buildQuiz({ mode, seed: 3 }, { rank: 0, missed: [] }).length).toBe(MODE_LEN[mode]);
    for (let era = 0; era < ERAS.length; era++) expect(buildQuiz({ mode: 'era', era, seed: 3 }, { rank: 0, missed: [] }).length).toBe(10);
    for (const code of ALL_CODES) expect(buildQuiz({ mode: 'canton', code, seed: 3 }, { rank: 0, missed: [] }).length).toBe(10);
  });

  it('le défi du jour est identique pour tous', () => {
    const a = buildQuiz({ mode: 'daily', seed: 42 }, { rank: 0, missed: [] }).map(q => q.id + q.choices.join());
    const b = buildQuiz({ mode: 'daily', seed: 42 }, { rank: 7, missed: [] }).map(q => q.id + q.choices.join());
    expect(a).toEqual(b);
  });
});
