import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useProgress } from '../state/progress';
import { RANKS } from '../quiz/scoring';
import { todayKey } from '../quiz/rng';

interface Row { id: string; name: string; value: number; sub: string }

export function Ranks() {
  const [tab, setTab] = useState<'all' | 'daily'>('all');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const uid = useProgress(s => s.user?.uid);
  const xp = useProgress(s => s.p.xp);

  useEffect(() => {
    let alive = true;
    setRows(null); setErr(null);
    const q = tab === 'all'
      ? query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(50))
      : query(collection(db, 'daily', todayKey(), 'scores'), orderBy('score', 'desc'), limit(50));
    getDocs(q).then(snap => {
      if (!alive) return;
      setRows(snap.docs.map(d => {
        const v = d.data();
        return tab === 'all'
          ? { id: d.id, name: v.name, value: v.xp, sub: `${RANKS[v.rank]?.icon ?? ''} ${RANKS[v.rank]?.title ?? ''} · indice ${v.index} % · ${v.badges} badge${v.badges > 1 ? 's' : ''}` }
          : { id: d.id, name: v.name, value: v.score, sub: `${v.correct}/10 bonnes réponses` };
      }));
    }).catch(e => alive && setErr((e as Error).message));
    return () => { alive = false; };
  }, [tab, xp]);

  return (
    <div className="page">
      <div className="page-in">
        <div>
          <h3>Classement</h3>
          <h1>La <em>Landsgemeinde</em> des joueurs</h1>
          <p className="lead">On lève la main pour compter les points. Le classement général suit l’XP cumulée ; le défi du jour remet tout le monde à égalité chaque matin.</p>
        </div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>Général</button>
          <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Défi du jour</button>
        </div>
        {err && <p className="err">Classement indisponible : {err}</p>}
        {!rows && !err && <p className="muted">Dépouillement en cours…</p>}
        {rows && !rows.length && <p className="muted">{tab === 'daily' ? 'Personne n’a encore joué le défi aujourd’hui. À toi l’honneur !' : 'Le classement est vide pour l’instant.'}</p>}
        {rows && rows.length > 0 && (
          <div className="lb">
            {rows.map((r, i) => (
              <div key={r.id} className={`r ${r.id === uid ? 'me' : ''}`}>
                <span className="pos">{i + 1}</span>
                <span className="nm"><b>{r.name}{r.id === uid ? ' (toi)' : ''}</b><small>{r.sub}</small></span>
                <span className="xp">{r.value.toLocaleString('fr-CH')}{tab === 'all' && <small className="muted" style={{ fontSize: '.6em' }}> XP</small>}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
