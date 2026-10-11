/* Contenu des fiches (spec §3.3) : canton/territoire, ville, lac, événement, bataille. */
import type { ReactNode } from 'react';
import {
  CINFO, CITIES, EVENTS, GEPOP, LAKES, NAMES, PEOPLES, POP, ST, TL, TYPES, WAR, deName,
  type CantonCode, type City, type HistEvent,
} from '../lib/data';
import { cityName, cityNow, lakeName } from '../lib/names';
import { fmtN, fmtPop, interpLog } from '../lib/population';
import { preAt, statusAt } from '../lib/territories';
import { fmtYear, fmtYearShort } from '../lib/time';
import { Portrait } from '../components/Portrait';
import { useAtlas } from '../state/atlas';
import { useQuiz } from '../state/quiz';
import { useProgress } from '../state/progress';
import { MASTERY, masteryHint, masteryLevel } from '../quiz/scoring';
import type { Selection } from '../map/AtlasMap';

export interface PanelView { kicker: string; title: string; body: ReactNode }

const DHS = 'https://hls-dhs-dss.ch/fr/';

function EvButtons({ list, year }: { list: HistEvent[]; year: number }) {
  const { setYear, select } = useAtlas.getState();
  return (
    <div className="evlist">
      {list.map(e => (
        <button key={e.id} className={`btn ${e.year > year ? 'future' : ''}`} onClick={() => { if (e.year > year) setYear(e.year); select({ kind: 'event', id: e.id }); }}>
          <b>{fmtYearShort(e.year)}</b><span>{e.title}</span>
        </button>
      ))}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return <span className="stars" aria-label={`${n} sur 4`}>{[0, 1, 2, 3].map(i => <span key={i} className={i < n ? '' : 'off'}>★</span>)}</span>;
}

function QuizCta({ code }: { code: CantonCode }) {
  const stat = useProgress(s => s.p.cantons[code]);
  const lvl = masteryLevel(stat);
  return (
    <button className="cta" onClick={() => useQuiz.getState().start({ mode: 'canton', code })}>
      <span className="big">🎯</span>
      <span style={{ flex: 1 }}>
        <b>Me tester sur ce canton</b>
        <small>Maîtrise : {MASTERY[lvl].title} <Stars n={lvl} /> · {masteryHint(stat)}</small>
      </span>
    </button>
  );
}

function cantonPanel(code: CantonCode, year: number): PanelView {
  const pre = year < 1291;
  const yl = fmtYear(year);
  let kicker: string, title: string;
  const parts: ReactNode[] = [];
  let info = null;
  if (pre) {
    const p = preAt(code, year)!;
    info = PEOPLES[`${p.eraIndex}:${p.key}`];
    kicker = `En ${yl}${info ? ' · ' + info.kind : ''}`;
    title = p.key === 'all' ? 'Avant les frontières' : p.label;
    if (info) {
      parts.push(
        <figure className="portrait" key="por"><Portrait fig={info.fig} bg={p.color} /><figcaption>{info.who}. Illustration d’après les découvertes archéologiques.</figcaption></figure>,
        <div className="facts" key="f1">{info.facts.map(([a, b]) => <div className="fact" key={a}><small>{a}</small><b>{b}</b></div>)}</div>,
        <div className="sub" key="s1">Leur vie</div>, <p key="life">{info.life}</p>,
        <div className="sub" key="s2">Ce qu’ils croyaient</div>, <p key="bel">{info.belief}</p>,
        <div className="know" key="know"><span>Le saviez-vous ?</span><p>{info.fact}</p></div>,
        <div className="sub" key="s3">À voir aujourd’hui</div>, <ul className="see" key="see">{info.see.map(x => <li key={x}>{x}</li>)}</ul>,
      );
    } else parts.push(<p key="note">{p.era.note}</p>);
  } else {
    const s = statusAt(code, year)!;
    kicker = `En ${yl} · ${ST[s[1]][0]}`;
    title = s[2];
  }
  const facts = (
    <div className="facts" key="facts">
      <div className="fact"><small>Aujourd’hui</small><b>Canton {deName(code)}</b></div>
      {code === 'GE' && year >= 1357
        ? <div className="fact"><small>Habitants de la ville</small><b>{fmtPop(interpLog(GEPOP, year)!)}</b></div>
        : <div className="fact"><small>Habitants en Suisse</small><b>{(() => { const p = interpLog(POP, year); return p ? fmtPop(p) : '—'; })()}</b></div>}
    </div>
  );
  if (info) parts.push(facts); else parts.unshift(facts);
  const cur = statusAt(code, year);
  parts.push(<QuizCta code={code} key="cta" />);
  parts.push(
    <div className="sub" key="hs">Histoire du territoire de l’actuel canton {deName(code)}</div>,
    <div className="hist" key="hist">
      {pre && <div className="now" style={{ '--c': preAt(code, year)!.color } as React.CSSProperties}><b>{fmtYearShort(year)}</b>{preAt(code, year)!.label}</div>}
      {TL[code].map(s => (
        <div key={s[0] + s[2]} className={!pre && cur === s ? 'now' : ''} style={{ '--c': ST[s[1]][2] } as React.CSSProperties}><b>{s[0]}</b>{s[2]}</div>
      ))}
    </div>,
  );
  const ci = CINFO[code];
  parts.push(
    <div className="sub" key="today">Le canton {deName(code)} aujourd’hui</div>,
    <div className="facts" key="cf">
      <div className="fact"><small>Chef-lieu</small><b>{ci.cap}</b></div>
      <div className="fact"><small>Habitants</small><b>{fmtN(ci.pop)}</b></div>
      <div className="fact"><small>Superficie</small><b>{fmtN(ci.km2)} km²</b></div>
      <div className="fact"><small>Langues</small><b>{ci.lang}</b></div>
    </div>,
    <dl className="ident" key="id">
      <dt>Traditions</dt><dd>{ci.trad}</dd>
      <dt>À table</dt><dd>{ci.food}</dd>
      {ci.people !== '—' && <><dt>Figures</dt><dd>{ci.people}</dd></>}
    </dl>,
  );
  const cl = CITIES.filter(c => c.code === code);
  if (cl.length) parts.push(
    <div className="sub" key="cs">Villes du canton</div>,
    <div className="evlist" key="cl">
      {cl.map(c => {
        const n = cityName(c, year), now = cityNow(c);
        return (
          <button key={c.id} className={`btn ${n ? '' : 'future'}`} onClick={() => useAtlas.getState().select({ kind: 'city', id: c.id })}>
            <b>{n ? (c.pop ? fmtN(c.pop) : '—') : 'pas encore'}</b>
            <span>{now}{n && n !== now && <i className="muted"> ({n})</i>}</span>
          </button>
        );
      })}
    </div>,
  );
  const evs = EVENTS.filter(e => e.code === code);
  if (evs.length) parts.push(<div className="sub" key="es">Événements</div>, <EvButtons key="ev" list={evs} year={year} />);
  parts.push(<p className="src" key="src">Sources : <a href={DHS} target="_blank" rel="noopener">Dictionnaire historique de la Suisse</a> et Wikipédia (articles des cantons). Population : OFS.</p>);
  if (code === 'GE') parts.push(<p className="src" key="src2">Population de la ville : <a href="https://hls-dhs-dss.ch/fr/articles/002903" target="_blank" rel="noopener">DHS, Genève (commune)</a>, interpolée entre les dates connues.</p>);
  return { kicker, title, body: parts };
}

function cityPanel(c: City, year: number): PanelView {
  const n = cityName(c, year), now = cityNow(c), first = c.names[0];
  const near = EVENTS.filter(e => Math.hypot(e.lat - c.lat, (e.lon - c.lon) * 0.68) < 0.05);
  const popTxt = c.pop ? `${fmtN(c.pop)} (2020)` : c.names[c.names.length - 1][1] === null ? 'Site archéologique' : 'Petite localité';
  return {
    kicker: `Ville · canton ${deName(c.code)}`,
    title: n || now,
    body: (
      <>
        <div className="facts">
          <div className="fact"><small>Premier nom connu</small><b>{first[1]} ({fmtYear(first[0])})</b></div>
          {c.code === 'GE' && year >= 1357 && year < 2026
            ? <div className="fact"><small>Habitants en {year}</small><b>{fmtN(Math.round(interpLog(GEPOP, year)! / 10) * 10)}</b></div>
            : <div className="fact"><small>Habitants</small><b>{popTxt}</b></div>}
        </div>
        <p>{c.info}</p>
        {!n && <p className="src">En {fmtYear(year)}, la ville n’existe pas encore, ou n’est pas encore mentionnée.</p>}
        <div className="sub">Ses noms</div>
        <div className="hist">
          {c.names.map(([y, nm]) => <div key={y} className={n === nm ? 'now' : ''} style={{ '--c': 'var(--gold)' } as React.CSSProperties}><b>{fmtYearShort(y)}</b>{nm || 'Ville abandonnée'}</div>)}
        </div>
        {near.length > 0 && <><div className="sub">Ce qui s’est passé ici</div><EvButtons list={near} year={year} /></>}
        <p className="src">Population 2020 : OFS, d’après <a href="https://en.wikipedia.org/wiki/List_of_cities_in_Switzerland" target="_blank" rel="noopener">la liste des villes de Suisse</a>.</p>
      </>
    ),
  };
}

function lakePanel(id: number, year: number): PanelView {
  const L = LAKES[id] ?? { names: [], km2: 0, note: '' };
  const n = lakeName(id, year);
  return {
    kicker: L.made ? `Lac artificiel · ${L.made}` : 'Lac',
    title: n || 'Lac sans nom connu',
    body: (
      <>
        <div className="facts">
          <div className="fact"><small>Superficie</small><b>{L.km2.toLocaleString('fr-CH')} km²</b></div>
          <div className="fact"><small>Profondeur max.</small><b>{L.m ? `${L.m} m` : '—'}</b></div>
        </div>
        <p>{L.note}</p>
        {L.names.length > 0 && <>
          <div className="sub">Ses noms à travers le temps</div>
          <div className="hist">{L.names.map(([y, nm]) => <div key={y} className={n === nm ? 'now' : ''} style={{ '--c': '#4f8fc0' } as React.CSSProperties}><b>{fmtYearShort(y)}</b>{nm}</div>)}</div>
        </>}
        {!n && <p className="src">En {fmtYear(year)}, aucun nom de ce lac ne nous est parvenu.</p>}
      </>
    ),
  };
}

function eventPanel(e: HistEvent, year: number): PanelView {
  const w = e.type === 'bat' ? WAR[e.title] : null;
  const near = w ? EVENTS.filter(x => x.id !== e.id && WAR[x.title]?.[0] === w[0]) : EVENTS.filter(x => x.code === e.code && x.id !== e.id);
  return {
    kicker: fmtYear(e.year),
    title: e.title,
    body: (
      <>
        <span className="tag"><i style={{ background: TYPES[e.type][1] }} />{TYPES[e.type][0]} · {NAMES[e.code]}</span>
        {w && (
          <div className="war">
            <div className="wname">{w[0]}</div>
            <div className="sides"><span>{w[1]}</span><b>contre</b><span>{w[2]}</span></div>
            <div className="win">Vainqueur : <strong>{w[3]}</strong></div>
          </div>
        )}
        <p>{e.text}</p>
        {near.length > 0 && <><div className="sub">{w ? 'Les autres batailles de cette guerre' : 'Dans la même région'}</div><EvButtons list={near} year={year} /></>}
        <button className="cta" onClick={() => useQuiz.getState().start({ mode: 'canton', code: e.code })}>
          <span className="big">🎯</span>
          <span><b>Quiz : canton {deName(e.code)}</b><small>Teste ce que tu viens d’apprendre</small></span>
        </button>
        <p className="src">Pour aller plus loin : <a href={`${DHS}search/?text=${encodeURIComponent(e.title.replace(/^(Le |La |L’|Les )/, ''))}`} target="_blank" rel="noopener">chercher dans le Dictionnaire historique de la Suisse</a></p>
      </>
    ),
  };
}

export function panelFor(sel: Selection, year: number): PanelView | null {
  if (!sel) return null;
  switch (sel.kind) {
    case 'canton': return cantonPanel(sel.code, year);
    case 'city': return cityPanel(CITIES[sel.id], year);
    case 'lake': return lakePanel(sel.id, year);
    case 'event': return eventPanel(EVENTS[sel.id], year);
  }
}

