import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ERAS, NAMES } from '../lib/data';
import { CATS, FICHE_BY_ID } from '../lib/fiches';
import { Portrait } from '../components/Portrait';
import { useApp } from '../state/app';
import { useProgress, type AnswerRecord, type GameResult } from '../state/progress';
import { useQuiz } from '../state/quiz';
import { buildQuiz, MODE_TIMER, type QuizConfig } from './sampler';
import { pointsFor, rankOf } from './scoring';
import { Result, type RecapItem } from './Result';
import type { Question } from './bank';

const MODE_TITLE: Record<string, string> = {
  quick: 'Partie rapide', era: 'Époque', canton: 'Canton', cat: 'Thème', fiche: 'Révision de fiche', exam: 'Examen blanc', daily: 'Défi du jour', survival: 'Survie', review: 'Révision',
};
const LIVES = 3;

function useTimer(total: number, running: boolean, key: unknown, onEnd: () => void) {
  const [left, setLeft] = useState(total);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    setLeft(total);
    if (!total || !running) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const l = Math.max(0, total - (t - t0) / 1000);
      setLeft(l);
      if (l <= 0) { end.current(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, key, total]);
  return left;
}

export function QuizRun({ config }: { config: QuizConfig }) {
  const p = useProgress(s => s.p);
  const questions = useMemo<Question[]>(
    () => buildQuiz(config, { rank: rankOf(p.xp).index, missed: p.missed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );
  const total = MODE_TIMER[config.mode];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [answers, setAnswers] = useState<(AnswerRecord & { pts: number })[]>([]);
  const [done, setDone] = useState<GameResult | null>(null);
  const [lastPts, setLastPts] = useState(0);
  const q = questions[idx];
  const revealed = picked !== null || timedOut;

  const answer = useCallback((choice: number | null, frac: number | null) => {
    if (!q || revealed) return;
    const ok = choice === q.answer;
    const ns = ok ? streak + 1 : 0;
    const pts = ok ? pointsFor(q.diff, total ? frac : null, streak) : 0;
    if (choice === null) setTimedOut(true); else setPicked(choice);
    setStreak(ns);
    setBestStreak(b => Math.max(b, ns));
    setScore(s => s + pts);
    setLastPts(pts);
    if (!ok && config.mode === 'survival') setLives(l => l - 1);
    setAnswers(a => [...a, { id: q.id, ok, codes: q.codes, era: q.era, pts }]);
  }, [q, revealed, streak, total, config.mode]);

  const left = useTimer(total, !revealed && !done, idx, () => answer(null, 0));

  const finish = useCallback(() => {
    const correct = answers.filter(a => a.ok).length;
    const g = { mode: config.mode, correct, total: answers.length, bestStreak, score };
    const xp = config.mode === 'exam' ? score * 0.8 : score;
    const r = useProgress.getState().recordGame(g, answers, xp);
    if (config.mode === 'daily') void useProgress.getState().submitDaily(score, correct).catch(() => {});
    setDone(r);
  }, [answers, bestStreak, score, config.mode]);

  const next = useCallback(() => {
    const over = idx + 1 >= questions.length || (config.mode === 'survival' && lives <= 0);
    if (over) { finish(); return; }
    setIdx(i => i + 1);
    setPicked(null);
    setTimedOut(false);
  }, [idx, questions.length, config.mode, lives, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !q) return;
      if (useApp.getState().fiche) return; // une fiche est ouverte par-dessus
      if (!revealed && /^[1-4]$/.test(e.key) && +e.key <= q.choices.length) answer(+e.key - 1, total ? left / total : null);
      else if (revealed && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [q, revealed, answer, next, left, total, done]);

  const quit = () => useQuiz.getState().quit();
  const again = () => useQuiz.getState().start({ ...config, seed: config.mode === 'daily' ? config.seed : undefined });

  if (!questions.length) {
    return <div className="qwrap"><div className="qbody"><div className="qcard"><p className="qprompt">Pas assez de questions pour ce mode.</p><button className="ghost" onClick={quit}>Retour</button></div></div></div>;
  }

  if (done) {
    const correct = answers.filter(a => a.ok).length, n = answers.length;
    const pct = Math.round((correct / Math.max(1, n)) * 100);
    const verdict = config.mode === 'exam'
      ? (pct >= 70 ? 'Examen réussi 🇨🇭' : 'Pas encore… révise et retente')
      : config.mode === 'survival' ? `${correct} bonnes réponses avant de tomber`
        : pct === 100 ? 'Parfait. Guillaume Tell serait fier.' : pct >= 80 ? 'Excellent !' : pct >= 60 ? 'Bien joué' : pct >= 40 ? 'Ça vient…' : 'Les fiches t’attendent pour réviser';
    const recap: RecapItem[] = answers.map((a, i) => {
      const qq = questions[i];
      return { ok: a.ok, label: qq.headline?.replace(/^« |»$/g, '') || FICHE_BY_ID.get(qq.fiche)?.title || qq.prompt, detail: `Réponse : ${qq.choices[qq.answer]}`, fiche: qq.fiche };
    });
    return (
      <div className="qwrap"><div className="qbody">
        <Result title={MODE_TITLE[config.mode] + (config.mode === 'era' ? ` · ${ERAS[config.era!].name}` : config.mode === 'canton' ? ` · ${NAMES[config.code!]}` : config.mode === 'cat' ? ` · ${CATS[config.cat!].plural}` : config.mode === 'fiche' ? ` · ${FICHE_BY_ID.get(config.fiches![0])?.title ?? ''}` : '')}
          score={score.toLocaleString('fr-CH')} scoreLabel={`points · ${correct}/${n} bonnes réponses (${pct} %) · meilleure série ${bestStreak}`}
          verdict={verdict} result={done} recap={recap} onAgain={again} onBack={quit}
          celebrate={pct >= 80 || (config.mode === 'exam' && pct >= 70)} />
      </div></div>
    );
  }

  const isOk = revealed && answers[answers.length - 1]?.ok;
  const fiche = FICHE_BY_ID.get(q.fiche);

  return (
    <div className="qwrap">
      <div className="qtop">
        <button className="quit" onClick={quit} aria-label="Quitter la partie">✕</button>
        {config.mode === 'survival'
          ? <div className="qprog" aria-label={`${lives} vies`}><span style={{ fontSize: '1.2rem' }}>{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(LIVES - Math.max(0, lives))}</span><span className="muted" style={{ marginLeft: 10, fontWeight: 800 }}>Question {idx + 1}</span></div>
          : <div className="qprog">{questions.map((_, i) => <i key={i} className={i < answers.length ? (answers[i].ok ? 'ok' : 'ko') : i === idx ? 'cur' : ''} />)}</div>}
        <div className="qscore">{score.toLocaleString('fr-CH')}</div>
      </div>
      <div className="qbody">
        <div className="qcard" key={idx}>
          {total > 0 && <div className={`timer ${left < 5 ? 'low' : ''}`}><i style={{ transform: `scaleX(${revealed ? 0 : left / total})` }} /></div>}
          <div className="qmeta">
            <span className="pill">{MODE_TITLE[config.mode]}</span>
            <span className="pill">{ERAS[q.era].short}</span>
            <span className="pill">{'●'.repeat(q.diff)}{'○'.repeat(3 - q.diff)} difficulté</span>
            {streak >= 2 && <span className="pill streak">🔥 série ×{streak} · bonus +{Math.min(streak, 10) * 10} %</span>}
          </div>
          <h2 className="qprompt">{q.prompt}</h2>
          {q.headline && <div className="qhead">{q.headline}</div>}
          {q.image && <div className="qimg"><img src={q.image} alt="Illustration à reconnaître" /></div>}
          {q.portrait && <div className="qportrait"><Portrait fig={q.portrait.fig} bg={q.portrait.bg} size={170} /></div>}
          {q.context && <div className="qctx">{q.context}</div>}
          <div className="choices">
            {q.choices.map((c, i) => {
              const st = revealed ? (i === q.answer ? 'ok' : i === picked ? 'ko' : 'dim') : '';
              return (
                <button key={i} className={`choice ${st}`} disabled={revealed} onClick={() => answer(i, total ? left / total : null)}>
                  <span className="kb">{i + 1}</span>{c}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className={`feedback ${isOk ? 'ok' : 'ko'}`}>
              <div className="fh">
                <span>{isOk ? 'Bonne réponse !' : timedOut ? 'Temps écoulé' : 'Raté'}</span>
                {isOk && <span className="pts">+{lastPts}</span>}
              </div>
              <p>{q.explain}</p>
              <div className="actions">
                {fiche && <button className="ghost" onClick={() => useApp.getState().open(fiche.id)}>Lire la fiche</button>}
                <button className="primary" onClick={next} autoFocus>{idx + 1 >= questions.length || (config.mode === 'survival' && lives <= 0) ? 'Voir le résultat' : 'Question suivante'} →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
