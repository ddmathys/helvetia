import { describe, expect, it } from 'vitest';
import { posOf, yearOf, eraOf, fmtYear } from './time';
import { EVENTS, CITIES, PEOPLES, WAR } from './data';
import { FICHES, FICHE_BY_ID, TRADITIONS, relatedFiches, searchFiches } from './fiches';

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

describe('données', () => {
  it('volumes de la spec', () => {
    expect(EVENTS.length).toBe(178);
    expect(Object.keys(WAR).length).toBe(32);
    expect(CITIES.length).toBe(41);
    expect(Object.keys(PEOPLES).length).toBe(31);
  });
});

describe('fiches', () => {
  it('une fiche par événement, ville, tradition et peuple, identifiants uniques', () => {
    expect(FICHES.length).toBe(EVENTS.length + CITIES.length + TRADITIONS.length + Object.keys(PEOPLES).length);
    expect(FICHE_BY_ID.size).toBe(FICHES.length);
  });
  it('recherche sans accents', () => {
    expect(searchFiches('nafels').some(f => f.title === 'Näfels')).toBe(true);
    expect(searchFiches('raclette').some(f => f.id === 'tr-raclette')).toBe(true);
  });
  it('fiches liées : proches dans le temps et l’espace', () => {
    const ids = relatedFiches(FICHE_BY_ID.get('ev31')!, 6).map(f => f.id); // Morgarten, 1315
    expect(ids).toContain('ev32'); // pacte de Brunnen, 1315
    expect(ids).not.toContain('ev2'); // villages lacustres du lac de Zoug : même canton, mais 5 000 ans plus tôt
  });
});
