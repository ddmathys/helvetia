import { create } from 'zustand';
import type { QuizConfig } from '../quiz/sampler';
import { useApp } from './app';

interface QuizState {
  /** Partie en cours (null = écran d'accueil du quiz) */
  config: QuizConfig | null;
  run: number;
  start: (c: QuizConfig) => void;
  quit: () => void;
}

export const useQuiz = create<QuizState>(set => ({
  config: null,
  run: 0,
  start: config => {
    set(s => ({ config, run: s.run + 1 }));
    useApp.getState().setView('quiz');
  },
  quit: () => set({ config: null }),
}));
