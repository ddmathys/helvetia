import { create } from 'zustand';
import type { Selection } from '../map/AtlasMap';
import { MAX_YEAR, MIN_YEAR } from '../lib/time';

export type View = 'atlas' | 'quiz' | 'ranks' | 'profile';

interface AtlasState {
  view: View;
  year: number;
  playing: boolean;
  selection: Selection;
  hintSeen: boolean;
  /** Demande de zoom (consommée par la carte) */
  focus: { sel: Selection; n: number } | null;
  setView: (v: View) => void;
  setYear: (y: number) => void;
  setPlaying: (p: boolean) => void;
  select: (s: Selection, zoom?: boolean) => void;
}

let focusN = 0;

export const useAtlas = create<AtlasState>(set => ({
  view: 'atlas',
  year: 1291,
  playing: false,
  selection: null,
  hintSeen: false,
  focus: null,
  setView: view => set({ view }),
  setYear: y => set({ year: Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(y))) }),
  setPlaying: playing => set({ playing }),
  select: (selection, zoom = true) => set(s => ({
    selection,
    hintSeen: s.hintSeen || !!selection,
    focus: zoom && selection ? { sel: selection, n: ++focusN } : s.focus,
  })),
}));
