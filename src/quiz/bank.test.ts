import { describe, expect, it } from 'vitest';
import { FACTORIES } from './bank';
import { FICHES } from '../lib/fiches';
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
        if (q.choices.length < 2) bad.push(`${f.id}: ${q.choices.length} choix`);
        if (new Set(q.choices).size !== q.choices.length) bad.push(`${f.id}: doublon ${q.choices.join(' / ')}`);
        if (q.answer < 0 || q.answer >= q.choices.length) bad.push(`${f.id}: réponse hors bornes`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('volumes', () => {
    const byKind: Record<string, number> = {};
    FACTORIES.forEach(f => (byKind[f.kind] = (byKind[f.kind] ?? 0) + 1));
    const byEra = ERAS.map((_, i) => FACTORIES.filter(f => f.era === i).length);
    console.log('fabriques', FACTORIES.length, byKind, 'par époque', byEra);
    expect(FACTORIES.length).toBeGreaterThan(600);
    // chaque fiche nourrit au moins une question (sauf la fiche générique de la préhistoire)
    const covered = new Set(FACTORIES.map(f => f.fiche));
    expect(FICHES.filter(f => !covered.has(f.id)).map(f => f.id)).toEqual(['pe-0-all']);
    for (const n of byEra) expect(n).toBeGreaterThanOrEqual(10);
  });

  it('chaque mode remplit sa partie', () => {
    const modes: ModeId[] = ['quick', 'exam', 'daily', 'survival'];
    for (const mode of modes) expect(buildQuiz({ mode, seed: 3 }, { rank: 0, missed: [] }).length).toBe(MODE_LEN[mode]);
    for (let era = 0; era < ERAS.length; era++) expect(buildQuiz({ mode: 'era', era, seed: 3 }, { rank: 0, missed: [] }).length).toBe(10);
    for (const code of ALL_CODES) expect(buildQuiz({ mode: 'canton', code, seed: 3 }, { rank: 0, missed: [] }).length).toBe(10);
    for (const cat of ['evenement', 'lieu', 'tradition', 'peuple'] as const) expect(buildQuiz({ mode: 'cat', cat, seed: 3 }, { rank: 0, missed: [] }).length).toBe(10);
    const fq = buildQuiz({ mode: 'fiche', fiches: ['tr-escalade', 'ev94', 'ci0', 'ev143', 'ev164', 'ev86'], seed: 3 }, { rank: 0, missed: [] });
    expect(fq.length).toBe(5);
    expect(fq.slice(0, 2).map(q => q.fiche)).toEqual(['tr-escalade', 'tr-escalade']);
  });

  it('le défi du jour est identique pour tous', () => {
    const a = buildQuiz({ mode: 'daily', seed: 42 }, { rank: 0, missed: [] }).map(q => q.id + q.choices.join());
    const b = buildQuiz({ mode: 'daily', seed: 42 }, { rank: 7, missed: [] }).map(q => q.id + q.choices.join());
    expect(a).toEqual(b);
  });
});
