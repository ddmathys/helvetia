import { describe, expect, it } from 'vitest';
import { posOf, yearOf, eraOf, fmtYear } from './time';
import { statusAt, entityOf, countAt } from './territories';
import { interpLog, fmtPop } from './population';
import { ALL_CODES, POP, EVENTS, CITIES, LAKES, PEOPLES, WAR } from './data';

describe('échelle du temps', () => {
  it('bornes', () => {
    expect(posOf(-15000)).toBe(0);
    expect(posOf(1291)).toBe(38);
    expect(posOf(2026)).toBe(100);
  });
  it('aller-retour posOf/yearOf', () => {
    for (const y of [-15000, -5000, -58, 0, 443, 1291, 1476, 1798, 1848, 1979, 2026]) expect(yearOf(posOf(y))).toBe(y);
  });
  it('époques', () => {
    expect(eraOf(-5000)).toBe(0);
    expect(eraOf(1291)).toBe(5);
    expect(eraOf(2026)).toBe(8);
  });
  it('format', () => {
    expect(fmtYear(-5000)).toMatch(/^5.000 av\. J\.-C\.$/);
    expect(fmtYear(1291)).toBe('1291');
  });
});

const keysAt = (y: number) => new Set(ALL_CODES.map(c => entityOf(c, y).key));

describe('territoires', () => {
  it('-5000 : un seul territoire', () => expect(keysAt(-5000).size).toBe(1));
  it('1400 : bloc Habsbourg unique', () => {
    const habs = ALL_CODES.filter(c => entityOf(c, 1400).label === 'Habsbourg');
    expect(habs.sort()).toEqual(['AG', 'TG']);
    expect(new Set(habs.map(c => entityOf(c, 1400).key)).size).toBe(1);
    expect(entityOf('OW', 1400).key).toBe(entityOf('NW', 1400).key);
  });
  it('1800 : une seule République helvétique', () => {
    const k = [...keysAt(1800)].filter(k => k.startsWith('helv'));
    expect(k.length).toBe(1);
  });
  it('1900 : Jura fusionné dans Berne', () => expect(entityOf('JU', 1900).key).toBe(entityOf('BE', 1900).key));
  it('2026 : 26 entités', () => {
    expect(keysAt(2026).size).toBe(26);
    expect(countAt(2026)).toBe('23 cantons (26 avec les demi-cantons)');
  });
  it('statusAt', () => {
    expect(statusAt('VD', 1600)?.[1]).toBe('sujet');
    expect(statusAt('GE', 1800)?.[1]).toBe('fr');
    expect(statusAt('UR', 1200)).toBeNull();
  });
});

describe('population', () => {
  it('interpolation log-linéaire', () => {
    expect(interpLog(POP, 1798)).toBeCloseTo(1664832);
    const mid = interpLog([[0, 100], [10, 10000]], 5)!;
    expect(mid).toBeCloseTo(1000);
    expect(interpLog(POP, 2030)).toBe(9127100);
    expect(interpLog([[1357, 2500]], 1000)).toBeNull();
  });
  it('format', () => {
    expect(fmtPop(1_200_000)).toMatch(/^1,2 M$/);
  });
});

describe('données', () => {
  it('volumes de la spec', () => {
    expect(EVENTS.length).toBe(178);
    expect(Object.keys(WAR).length).toBe(32);
    expect(CITIES.length).toBe(41);
    expect(Object.keys(LAKES).length).toBe(22);
    expect(Object.keys(PEOPLES).length).toBe(31);
  });
});
