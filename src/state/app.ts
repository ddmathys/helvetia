/* Navigation : onglet courant et fiche ouverte (avec le bouton « retour » du téléphone). */
import { create } from 'zustand';
import { FICHE_BY_ID } from '../lib/fiches';

export type View = 'fiches' | 'quiz' | 'ranks' | 'profile';

interface AppState {
  view: View;
  /** Fiche affichée par-dessus l'onglet courant */
  fiche: string | null;
  setView: (v: View) => void;
  open: (id: string) => void;
  close: () => void;
}

export const useApp = create<AppState>((set, get) => ({
  view: 'fiches',
  fiche: null,
  setView: view => {
    if (get().fiche) get().close();
    set({ view });
  },
  open: id => {
    if (!FICHE_BY_ID.has(id)) return;
    // une entrée d'historique par fiche : « retour » ramène à la précédente
    history.pushState({ fiche: id }, '', `?f=${id}`);
    set({ fiche: id });
  },
  close: () => {
    if (history.state?.fiche) history.back();
    else set({ fiche: null });
  },
}));

/** À appeler une fois : synchronise l'état avec l'historique du navigateur. */
export function bindHistory() {
  const q = new URLSearchParams(location.search);
  const f = q.get('f');
  const v = q.get('v') as View | null;
  if (v && ['fiches', 'quiz', 'ranks', 'profile'].includes(v)) useApp.setState({ view: v });
  if (f && FICHE_BY_ID.has(f)) {
    // lien partagé : on glisse une entrée « liste » dessous pour que « retour » ne quitte pas l'app
    history.replaceState(null, '', location.pathname);
    history.pushState({ fiche: f }, '', `?f=${f}`);
    useApp.setState({ fiche: f });
  }
  const onPop = (e: PopStateEvent) => useApp.setState({ fiche: e.state?.fiche ?? null });
  addEventListener('popstate', onPop);
  return () => removeEventListener('popstate', onPop);
}
