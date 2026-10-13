/* Filtres de la bibliothèque de fiches, partagés (une fiche peut ouvrir « toutes les fiches de ce canton »). */
import { create } from 'zustand';
import type { CantonCode } from '../lib/data';
import type { Cat } from '../lib/fiches';

export type Sort = 'chrono' | 'recent' | 'alpha';

export interface Filters {
  q: string;
  cat: Cat | 'all';
  canton: CantonCode | null;
  kinds: string[];
  era: number | null;
  from: number | null;
  to: number | null;
  sort: Sort;
}

export const EMPTY: Filters = { q: '', cat: 'all', canton: null, kinds: [], era: null, from: null, to: null, sort: 'chrono' };

interface FilterState extends Filters {
  set: (p: Partial<Filters>) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>(set => ({
  ...EMPTY,
  set: p => set(p),
  reset: () => set({ ...EMPTY }),
}));

/** Nombre de filtres actifs (hors recherche et thème, visibles ailleurs). */
export const activeCount = (f: Filters) => (f.canton ? 1 : 0) + f.kinds.length + (f.era !== null ? 1 : 0) + (f.from !== null || f.to !== null ? 1 : 0);
