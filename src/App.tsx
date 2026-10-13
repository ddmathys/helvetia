import { useEffect } from 'react';
import { FichesView } from './views/Fiches';
import { FichePage } from './views/FichePage';
import { QuizHub } from './quiz/QuizHub';
import { QuizRun } from './quiz/QuizRun';
import { Ranks } from './views/Ranks';
import { Profile } from './views/Profile';
import { bindHistory, useApp, type View } from './state/app';
import { useQuiz } from './state/quiz';
import { useProgress } from './state/progress';
import { rankOf } from './quiz/scoring';

const ICONS: Record<View, React.ReactNode> = {
  fiches: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" /><path d="M7 8h1.5M16 8h1.5" strokeLinecap="round" /></svg>,
  quiz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>,
  ranks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" /></svg>,
};
const LABELS: Record<View, string> = { fiches: 'Fiches', quiz: 'Quiz', ranks: 'Classement', profile: 'Profil' };

function Nav() {
  const view = useApp(s => s.view);
  const xp = useProgress(s => s.p.xp);
  const go = (v: View) => {
    if (v === 'quiz' && view === 'quiz') useQuiz.getState().quit();
    useApp.getState().setView(v);
  };
  return (
    <nav className="nav" aria-label="Navigation principale">
      <img className="logo" src="/logo.svg" alt="" aria-hidden="true" />
      {(Object.keys(LABELS) as View[]).map(v => (
        <button key={v} className={view === v ? 'on' : ''} onClick={() => go(v)} aria-current={view === v ? 'page' : undefined}>
          <span className="ico">{ICONS[v]}</span>
          {v === 'profile' ? rankOf(xp).icon + ' ' + LABELS[v] : LABELS[v]}
        </button>
      ))}
      <span className="spacer" />
    </nav>
  );
}

function QuizView() {
  const config = useQuiz(s => s.config);
  const run = useQuiz(s => s.run);
  if (!config) return <QuizHub />;
  return <QuizRun key={run} config={config} />;
}

export default function App() {
  const view = useApp(s => s.view);
  const fiche = useApp(s => s.fiche);
  useEffect(() => bindHistory(), []);
  useEffect(() => { useProgress.getState().init(); }, []);
  return (
    <div className="shell">
      <Nav />
      <main className="view">
        {/* la bibliothèque reste montée : filtres et position de défilement conservés */}
        <div style={{ display: view === 'fiches' ? 'contents' : 'none' }}><FichesView /></div>
        {view === 'quiz' && <QuizView />}
        {view === 'ranks' && <Ranks />}
        {view === 'profile' && <Profile />}
        {fiche && <FichePage id={fiche} />}
      </main>
    </div>
  );
}
