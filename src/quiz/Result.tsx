import { useEffect, useMemo } from 'react';
import { BADGES, rankOf } from './scoring';
import { useProgress, type GameResult } from '../state/progress';
import { useAtlas } from '../state/atlas';
import type { Selection } from '../map/AtlasMap';

export interface RecapItem { ok: boolean; label: string; detail?: string; see?: { sel: Selection; year: number } }

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.2 + Math.random() * 1.6,
    color: ['#f2c46d', '#e2453c', '#eef2f5', '#3fbf7f'][i % 4],
  })), []);
  return <div className="confetti" aria-hidden="true">{bits.map((b, i) => <i key={i} style={{ left: `${b.left}%`, background: b.color, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />)}</div>;
}

export function Result({ title, score, scoreLabel, verdict, sub, result, recap, onAgain, onBack, celebrate }: {
  title: string; score: string; scoreLabel: string; verdict: string; sub?: string; result: GameResult; recap: RecapItem[];
  onAgain: () => void; onBack: () => void; celebrate: boolean;
}) {
  const xp = useProgress(s => s.p.xp);
  const r = rankOf(xp);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const see = (it: RecapItem) => {
    if (!it.see) return;
    const s = useAtlas.getState();
    s.setYear(it.see.year);
    s.select(it.see.sel);
    s.setView('atlas');
  };
  return (
    <div className="result">
      {celebrate && <Confetti />}
      <div className="score-hero">
        <div className="muted" style={{ fontWeight: 800, fontSize: '.78rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{title}</div>
        <div className="big">{score}</div>
        <div className="muted" style={{ fontWeight: 700 }}>{scoreLabel}</div>
        <div className="verdict" style={{ marginTop: 10 }}>{verdict}</div>
        {sub && <p className="lead" style={{ margin: '6px auto 0' }}>{sub}</p>}
      </div>
      <div className="card">
        <div className="rankbar">
          <div className="ri">{r.icon}</div>
          <div className="rt">
            <small>+{result.xpGained.toLocaleString('fr-CH')} XP · total {xp.toLocaleString('fr-CH')} XP</small>
            <b>{r.title}</b>
            <div className="bar"><i style={{ width: `${Math.round(r.frac * 100)}%` }} /></div>
            <small>{r.next ? `${(r.next.xp - xp).toLocaleString('fr-CH')} XP avant « ${r.next.title} »` : 'Rang suprême atteint'}</small>
          </div>
        </div>
      </div>
      {result.rankUp && <div className="newbadge"><span className="bi">{r.icon}</span><div><b>Nouveau rang : {result.rankUp} !</b><div className="muted">Ta connaissance de la Suisse progresse.</div></div></div>}
      {result.newBadges.map(id => { const b = BADGES.find(x => x.id === id)!; return <div className="newbadge" key={id}><span className="bi">{b.icon}</span><div><b>Badge débloqué : {b.title}</b><div className="muted">{b.desc}</div></div></div>; })}
      <div className="actions">
        <button className="primary" onClick={onAgain}>Rejouer</button>
        <button className="ghost" onClick={onBack}>Autres modes</button>
      </div>
      <h3>Récapitulatif</h3>
      <div className="recap">
        {recap.map((it, i) => (
          <div key={i}>
            <span className={`m ${it.ok ? 'ok' : 'ko'}`}>{it.ok ? '✓' : '✗'}</span>
            <span style={{ flex: 1 }}><b style={{ color: 'var(--ink)' }}>{it.label}</b>{it.detail && <> · {it.detail}</>}</span>
            {it.see && <button className="chipbtn" onClick={() => see(it)}>Atlas ↗</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
