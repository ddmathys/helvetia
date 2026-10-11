import { useEffect } from 'react';
import { AtlasView } from './atlas/AtlasView';
import { QuizHub } from './quiz/QuizHub';
import { QuizRun } from './quiz/QuizRun';
import { ChronoGeo } from './quiz/ChronoGeo';
import { Ranks } from './views/Ranks';
import { Profile } from './views/Profile';
import { useAtlas, type View } from './state/atlas';
import { useQuiz } from './state/quiz';
import { useProgress } from './state/progress';
import { rankOf } from './quiz/scoring';
import { ALL_CODES, CITIES, EVENTS, LAKES, type CantonCode } from './lib/data';
import type { Selection } from './map/AtlasMap';

const ICONS: Record<View, React.ReactNode> = {
  atlas: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>,
  quiz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>,
  ranks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" /></svg>,
};
const LABELS: Record<View, string> = { atlas: 'Atlas', quiz: 'Quiz', ranks: 'Classement', profile: 'Profil' };

/* Partage : ?y=1476&s=e29 (événement), s=cGE (canton), s=v3 (ville), s=l9757 (lac), v=quiz */
const selToParam = (s: Selection) => !s ? null : s.kind === 'canton' ? 'c' + s.code : s.kind === 'event' ? 'e' + s.id : s.kind === 'city' ? 'v' + s.id : 'l' + s.id;
function paramToSel(p: string | null): Selection {
  if (!p) return null;
  const k = p[0], v = p.slice(1);
  if (k === 'c' && ALL_CODES.includes(v as CantonCode)) return { kind: 'canton', code: v as CantonCode };
  if (k === 'e' && EVENTS[+v]) return { kind: 'event', id: +v };
  if (k === 'v' && CITIES[+v]) return { kind: 'city', id: +v };
  if (k === 'l' && LAKES[v]) return { kind: 'lake', id: +v };
  return null;
}

function useUrlState() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = useAtlas.getState();
    const y = q.get('y');
    if (y !== null && !isNaN(+y)) s.setYear(+y);
    const sel = paramToSel(q.get('s'));
    if (sel) setTimeout(() => s.select(sel), 700);
    const v = q.get('v') as View | null;
    if (v && v in LABELS) s.setView(v);
    let t = 0;
    return useAtlas.subscribe(st => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const p = new URLSearchParams();
        if (st.view !== 'atlas') p.set('v', st.view);
        else {
          p.set('y', String(st.year));
          const sp = selToParam(st.selection);
          if (sp) p.set('s', sp);
        }
        history.replaceState(null, '', `${location.pathname}?${p}`);
      }, 250);
    });
  }, []);
}

function Nav() {
  const view = useAtlas(s => s.view);
  const xp = useProgress(s => s.p.xp);
  const go = (v: View) => {
    const a = useAtlas.getState();
    a.setPlaying(false);
    if (v === 'quiz' && view === 'quiz') useQuiz.getState().quit();
    a.setView(v);
  };
  return (
    <nav className="nav" aria-label="Navigation principale">
      <span className="logo" aria-hidden="true">H</span>
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
  if (config.mode === 'chrono') return <ChronoGeo key={run} />;
  return <QuizRun key={run} config={config} />;
}

export default function App() {
  const view = useAtlas(s => s.view);
  useUrlState();
  useEffect(() => { useProgress.getState().init(); }, []);
  return (
    <div className="shell">
      <Nav />
      <main className="view">
        <div style={{ display: view === 'atlas' ? 'contents' : 'none' }}><AtlasView /></div>
        {view === 'quiz' && <QuizView />}
        {view === 'ranks' && <Ranks />}
        {view === 'profile' && <Profile />}
      </main>
    </div>
  );
}
