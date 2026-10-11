/* Chrono-Géo : place l'événement sur la carte et dans le temps (spec §9, étape 5). Score = proximité en km + en années. */
import { useMemo, useState } from 'react';
import { ERAS, NAMES, PC, TYPES, type HistEvent } from '../lib/data';
import { km } from '../lib/geo';
import { eraOf, fmtYear, posOf, yearOf } from '../lib/time';
import { SwissMap } from '../components/SwissMap';
import { useProgress, type GameResult } from '../state/progress';
import { useQuiz } from '../state/quiz';
import { CHRONO_EVENTS } from './bank';
import { MODE_LEN } from './sampler';
import { mulberry32, shuffle } from './rng';
import { Result } from './Result';

interface Round { e: HistEvent; pin: [number, number]; year: number; dKm: number; dYears: number; geo: number; time: number }

export const geoScore = (dKm: number) => Math.round(500 * Math.exp(-dKm / 60));
/** Écart mesuré sur la barre déformée : se tromper d'un siècle en préhistoire compte moins qu'en 1848. */
export const timeScore = (guess: number, truth: number) => Math.round(500 * Math.exp(-Math.abs(posOf(guess) - posOf(truth)) / 6));

export function ChronoGeo() {
  const events = useMemo(() => shuffle(CHRONO_EVENTS, mulberry32(Math.floor(Math.random() * 2 ** 31))).slice(0, MODE_LEN.chrono), []);
  const [idx, setIdx] = useState(0);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [pos, setPos] = useState(50);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [done, setDone] = useState<GameResult | null>(null);
  const e = events[idx];
  const cur = rounds[idx];
  const guessYear = yearOf(pos);
  const total = rounds.reduce((a, r) => a + r.geo + r.time, 0);

  const validate = () => {
    if (!pin) return;
    const dKm = km(pin[0], pin[1], e.lat, e.lon);
    setRounds(r => [...r, { e, pin, year: guessYear, dKm, dYears: Math.abs(guessYear - e.year), geo: geoScore(dKm), time: timeScore(guessYear, e.year) }]);
  };
  const next = () => {
    if (idx + 1 >= events.length) {
      const answers = rounds.map(r => ({ id: `evm:${r.e.id}`, ok: r.geo + r.time >= 600, codes: [r.e.code], era: eraOf(r.e.year) }));
      const g = {
        mode: 'chrono', correct: answers.filter(a => a.ok).length, total: rounds.length, bestStreak: 0, score: total,
        chronoBestRound: Math.max(...rounds.map(r => r.geo + r.time)), chronoMinKm: Math.min(...rounds.map(r => r.dKm)),
      };
      setDone(useProgress.getState().recordGame(g, answers, total / 4));
      return;
    }
    setIdx(i => i + 1); setPin(null); setPos(50);
  };
  const quit = () => useQuiz.getState().quit();

  if (done) {
    const max = events.length * 1000;
    const pct = total / max;
    return (
      <div className="qwrap"><div className="qbody">
        <Result title="Chrono-Géo" score={total.toLocaleString('fr-CH')} scoreLabel={`points sur ${max.toLocaleString('fr-CH')}`}
          verdict={pct >= 0.8 ? 'Tu as la Suisse dans la peau.' : pct >= 0.6 ? 'Très belle boussole !' : pct >= 0.4 ? 'Pas mal du tout' : 'Le temps est une matière glissante…'}
          result={done} celebrate={pct >= 0.7} onAgain={() => useQuiz.getState().start({ mode: 'chrono' })} onBack={quit}
          recap={rounds.map(r => ({ ok: r.geo + r.time >= 600, label: r.e.title, detail: `${Math.round(r.dKm)} km · ${r.dYears} an${r.dYears > 1 ? 's' : ''} d’écart · ${r.geo + r.time} pts`, see: { sel: { kind: 'event', id: r.e.id }, year: r.e.year } }))} />
      </div></div>
    );
  }

  return (
    <div className="qwrap">
      <div className="qtop">
        <button className="quit" onClick={quit} aria-label="Quitter la partie">✕</button>
        <div className="qprog">{events.map((_, i) => <i key={i} className={i < rounds.length ? (rounds[i].geo + rounds[i].time >= 600 ? 'ok' : 'ko') : i === idx ? 'cur' : ''} />)}</div>
        <div className="qscore">{total.toLocaleString('fr-CH')}</div>
      </div>
      <div className="qbody">
        <div className="qcard" key={idx}>
          <div className="qmeta">
            <span className="pill">Chrono-Géo · manche {idx + 1}/{events.length}</span>
            <span className="pill"><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: TYPES[e.type][1], marginRight: 6 }} />{TYPES[e.type][0]}</span>
          </div>
          <h2 className="qprompt">{e.title}</h2>
          <div className="muted" style={{ fontWeight: 700, fontSize: '.88rem' }}>{cur ? '' : pin ? 'Ajuste ton épingle si besoin, puis la date.' : '1. Touche la carte là où cela s’est passé.'}</div>
          <SwissMap className="qmap cg-map" onPoint={(lat, lon) => !cur && setPin([lat, lon])} disabled={!!cur}
            cls={c => (cur && c === e.code ? 'ok' : '')}
            markers={[
              ...(pin ? [{ key: 'pin', lat: pin[0], lon: pin[1], color: '#f2c46d', label: cur ? 'Toi' : undefined }] : []),
              ...(cur ? [{ key: 'true', lat: e.lat, lon: e.lon, color: '#3fbf7f', label: NAMES[e.code], className: 'cg-true' }] : []),
            ]}
            lines={cur && pin ? [{ from: pin, to: [e.lat, e.lon] }] : []} />
          <div>
            <div className="muted" style={{ fontWeight: 700, fontSize: '.88rem' }}>2. Quand ? Glisse sur la frise du temps</div>
            <div className="cg-year">{fmtYear(guessYear)}</div>
            <div className="cg-track">
              <div className="bands">{ERAS.map((er, i) => <div key={i} style={{ width: `${PC[i + 1] - PC[i]}%`, background: er.color }} />)}</div>
              {cur && <span className="truth" style={{ left: `${posOf(e.year)}%` }} title={fmtYear(e.year)} />}
              <input type="range" min={0} max={100} step={0.05} value={pos} disabled={!!cur} aria-label="Année" aria-valuetext={fmtYear(guessYear)} onChange={ev => setPos(+ev.target.value)} />
            </div>
            <div className="eralbl">{[-58, 443, 1291, 1515, 1798, 1848, 2026].map(y => <span key={y} style={{ left: `${Math.min(97, posOf(y))}%` }}>{y}</span>)}</div>
          </div>
          {!cur ? (
            <div className="actions"><button className="primary" disabled={!pin} onClick={validate} style={{ opacity: pin ? 1 : 0.5 }}>Valider</button></div>
          ) : (
            <div className={`feedback ${cur.geo + cur.time >= 600 ? 'ok' : 'ko'}`}>
              <div className="fh">
                <span>{fmtYear(e.year)} · {NAMES[e.code]}</span>
                <span className="pts">+{cur.geo + cur.time}</span>
              </div>
              <div className="facts">
                <div className="fact"><small>Distance</small><b>{Math.round(cur.dKm)} km → {cur.geo} pts</b></div>
                <div className="fact"><small>Écart de date</small><b>{cur.dYears.toLocaleString('fr-CH')} an{cur.dYears > 1 ? 's' : ''} → {cur.time} pts</b></div>
              </div>
              <p>{e.text}</p>
              <div className="actions"><button className="primary" onClick={next} autoFocus>{idx + 1 >= events.length ? 'Voir le résultat' : 'Manche suivante'} →</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
