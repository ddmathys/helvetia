import { ALL_CODES, ERAS, NAMES } from '../lib/data';
import { SwissMap } from '../components/SwissMap';
import { useProgress } from '../state/progress';
import { useQuiz } from '../state/quiz';
import { MASTERY, eraIndex, helvetiaIndex, masteryLevel, rankOf } from './scoring';
import { seedFrom, todayKey } from './rng';
import { RingIndex } from '../components/RingIndex';

export function MasteryLegend() {
  return <div className="mlegend">{MASTERY.map((m, i) => <span key={i}><i style={{ background: m.color }} />{m.title}</span>)}</div>;
}

export function QuizHub() {
  const p = useProgress(s => s.p);
  const start = useQuiz(s => s.start);
  const r = rankOf(p.xp);
  const today = todayKey();
  const dailyDone = p.daily[today];
  const acc = p.answered ? Math.round((p.correct / p.answered) * 100) : 0;
  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(4 - n);

  return (
    <div className="page">
      <div className="page-in">
        <div>
          <h3>Le quiz Helvetia</h3>
          <h1>Prouve que tu connais <em>la Suisse</em>.</h1>
          <p className="lead">Plus de 1 200 questions tirées de l’atlas : batailles, traités, peuples, villes, lacs et les 26 cantons. Chaque bonne réponse fait grimper ta maîtrise du canton et de l’époque concernés.</p>
        </div>

        <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <RingIndex value={helvetiaIndex(p)} label="INDICE" />
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="rankbar">
              <div className="ri">{r.icon}</div>
              <div className="rt">
                <small>Rang {r.index + 1}/10 · {p.xp.toLocaleString('fr-CH')} XP</small>
                <b>{r.title}</b>
                <div className="bar"><i style={{ width: `${Math.round(r.frac * 100)}%` }} /></div>
                <small>{r.next ? `Prochain rang : ${r.next.title} (${r.next.xp.toLocaleString('fr-CH')} XP)` : 'Rang suprême'}</small>
              </div>
            </div>
            <div className="kpis">
              <div className="kpi"><small>Précision</small><b>{acc} %</b></div>
              <div className="kpi"><small>Parties</small><b>{p.games}</b></div>
              <div className="kpi"><small>Série record</small><b>{p.bestStreak}</b></div>
              <div className="kpi"><small>Époques</small><b>{eraIndex(p)} %</b></div>
            </div>
          </div>
        </div>

        <div className="grid">
          <button className="mode hero" onClick={() => start({ mode: 'quick' })}>
            <span className="mi">⚡</span>
            <b>Partie rapide</b>
            <small>10 questions de tous horizons, 20 secondes chacune. Les séries multiplient les points, la difficulté s’adapte à ton rang.</small>
            {p.best.quick ? <span className="best">Record {p.best.quick.toLocaleString('fr-CH')}</span> : null}
          </button>
          <button className="mode daily" onClick={() => start({ mode: 'daily', seed: seedFrom('helvetia-' + today) })}>
            <span className="mi">📅</span>
            <b>Défi du jour</b>
            <small>Les mêmes 10 questions pour tout le monde aujourd’hui. Seul le premier essai entre au classement.</small>
            {dailyDone !== undefined && <span className="best">Ton score : {dailyDone.toLocaleString('fr-CH')}</span>}
          </button>
          <button className="mode chrono" onClick={() => start({ mode: 'chrono' })}>
            <span className="mi">🧭</span>
            <b>Chrono-Géo</b>
            <small>Place l’événement sur la carte et sur la frise du temps. 1 000 points par manche selon les kilomètres et les années d’écart.</small>
            {p.chronoBest ? <span className="best">Record {p.chronoBest.toLocaleString('fr-CH')}</span> : null}
          </button>
          <button className="mode" onClick={() => start({ mode: 'survival' })}>
            <span className="mi">❤️</span>
            <b>Survie</b>
            <small>3 vies, 15 secondes par question, de plus en plus difficile. Jusqu’où iras-tu ?</small>
            {p.best.survival ? <span className="best">Record {p.best.survival}</span> : null}
          </button>
          <button className="mode" onClick={() => start({ mode: 'exam' })}>
            <span className="mi">📘</span>
            <b>Examen blanc</b>
            <small>30 questions sans chrono sur l’histoire et la géographie, réussi à 70 %. Pour préparer la naturalisation (hors institutions).</small>
            {p.examBest ? <span className="best">Meilleur {p.examBest} %</span> : null}
          </button>
          <button className="mode" disabled={p.missed.length < 3} onClick={() => start({ mode: 'review' })}>
            <span className="mi">🔁</span>
            <b>Mes erreurs</b>
            <small>{p.missed.length < 3 ? 'Se débloque après quelques erreurs : on y revient jusqu’à ce que ça rentre.' : `${p.missed.length} questions ratées à retravailler. Une bonne réponse les retire de la liste.`}</small>
          </button>
        </div>

        <div className="split">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <h3>Par canton · touche la carte</h3>
              <span className="muted" style={{ fontSize: '.8rem', fontWeight: 700 }}>Indice Helvetia {helvetiaIndex(p)} %</span>
            </div>
            <SwissMap className="qmap" hoverLabel labels={c => c}
              fill={c => MASTERY[masteryLevel(p.cantons[c])].color}
              onCanton={code => start({ mode: 'canton', code })} />
            <MasteryLegend />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Par époque</h3>
            <div className="evlist">
              {ERAS.map((e, i) => {
                const lvl = masteryLevel(p.eras[i]);
                return (
                  <button key={i} className="btn" onClick={() => start({ mode: 'era', era: i })} style={{ alignItems: 'center' }}>
                    <i style={{ width: 12, height: 12, borderRadius: 3, background: e.color, flex: 'none' }} />
                    <span style={{ flex: 1 }}>{e.name}</span>
                    <span className="stars" title={MASTERY[lvl].title}>{stars(lvl)}</span>
                  </button>
                );
              })}
            </div>
            <h3 style={{ marginTop: 6 }}>Cantons à travailler</h3>
            <div className="chips">
              {ALL_CODES.slice().sort((a, b) => masteryLevel(p.cantons[a]) - masteryLevel(p.cantons[b]) || (p.cantons[a]?.n ?? 0) - (p.cantons[b]?.n ?? 0)).slice(0, 8).map(c => (
                <button key={c} className="chipbtn" onClick={() => start({ mode: 'canton', code: c })}>
                  <i className="dot" style={{ background: MASTERY[masteryLevel(p.cantons[c])].color }} />{NAMES[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
