import { useEffect, useMemo, useRef, useState } from 'react';
import { AtlasMap } from '../map/AtlasMap';
import { useAtlas } from '../state/atlas';
import { ALL_CODES, CITIES, ERAS, EVENTS, NAMES, PC, POP, PRE, ST, type HistEvent } from '../lib/data';
import { eraOf, fmtYear, posOf, yearOf } from '../lib/time';
import { countAt, statusAt } from '../lib/territories';
import { fmtPop, interpLog, reliability } from '../lib/population';
import { panelFor } from './Panels';
import { Search } from './Search';

const SWORD_ICON = (
  <svg width="14" height="14" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" fill="#3a1410" stroke="#ff6a4d" strokeWidth="2" /><path d="M-7 -7L4 4M2 6L6 2M4 4L7.5 7.5M7 -7L-4 4M-2 6L-6 2M-4 4L-7.5 7.5" stroke="#ffd9c9" strokeWidth="2.2" strokeLinecap="round" /></svg>
);
const GHOST = <span><i style={{ background: 'transparent', border: '1.5px dashed #5c7189' }} />Frontière actuelle, pour repère</span>;
const NATIONAL = EVENTS.filter(e => e.lvl === 1);

function Header({ onSearch }: { onSearch: () => void }) {
  const year = useAtlas(s => s.year);
  const p = interpLog(POP, year);
  const rel = reliability(year);
  const count = countAt(year);
  return (
    <div className="head">
      <div className="when">
        <span className="brand">HELVETIA
          <button className="searchbtn" onClick={onSearch} aria-label="Rechercher">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            Chercher <kbd>/</kbd>
          </button>
        </span>
        <span className="year">{year < 0 ? <>{Math.abs(year).toLocaleString('fr-CH')}<small>av. J.-C.</small></> : year}</span>
        <span className="era">{ERAS[eraOf(year)].name}</span>
      </div>
      <div className="pop">
        <span className="lbl">Habitants</span>
        <span className="num">{p ? fmtPop(p) : '—'}</span>
        <span className={`chip ${rel.real ? 'real' : ''}`}>{rel.label}</span>
        {count && <span className="cantons">Confédération : <b>{count}</b></span>}
      </div>
    </div>
  );
}

function Legend() {
  const year = useAtlas(s => s.year);
  if (year < 1291) {
    const e = PRE.find(p => year >= p.from && year < p.to)!;
    return <div className="legend"><span>{SWORD_ICON}Bataille</span><span>{e.note}</span>{GHOST}</div>;
  }
  const used = new Set(ALL_CODES.map(c => statusAt(c, year)![1]));
  return (
    <div className="legend">
      <span>{SWORD_ICON}Bataille</span>
      {year < 1815 && GHOST}
      {Object.entries(ST).filter(([k]) => used.has(k as never)).map(([k, v]) => (
        <span key={k}><i style={{ background: k === 'allie' ? 'repeating-linear-gradient(45deg,#b07c2a 0 3px,#f0b552 3px 5px)' : k === 'sujet' ? 'repeating-linear-gradient(45deg,#7b4368 0 3px,#b9709f 3px 5px)' : v[2] }} />{v[0]}</span>
      ))}
    </div>
  );
}

function Dock() {
  const year = useAtlas(s => s.year);
  const playing = useAtlas(s => s.playing);
  const { setYear, setPlaying } = useAtlas.getState();
  return (
    <div className="dock">
      <Legend />
      <div className="row">
        <button className="play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Lecture'}>
          <svg width="18" height="18" viewBox="0 0 18 18">{playing
            ? <><rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor" /></>
            : <path d="M5 3l10 6-10 6z" fill="currentColor" />}</svg>
        </button>
        <div className="track">
          <div className="bands">{ERAS.map((e, i) => <div key={i} title={e.name} style={{ width: `${PC[i + 1] - PC[i]}%`, background: e.color }} />)}</div>
          <div className="ticks">{NATIONAL.map(e => <i key={e.id} style={{ left: `${posOf(e.year)}%` }} />)}</div>
          <input className="time" type="range" min={0} max={10000} step={1} value={Math.round(posOf(year) * 100)} aria-label="Année" aria-valuetext={fmtYear(year)}
            onChange={ev => { setPlaying(false); setYear(yearOf(+ev.target.value / 100)); }} />
        </div>
      </div>
      <div className="eralbl">{[-58, 443, 1291, 1515, 1798, 1848, 2026].map(y => <span key={y} style={{ left: `${Math.min(97, posOf(y))}%` }}>{y}</span>)}</div>
    </div>
  );
}

/** Lecture automatique : ~1,55 % de barre par seconde, pause de 1,3 s sur chaque événement national (spec §3.2). */
function usePlayback(onCross: (e: HistEvent) => void) {
  const playing = useAtlas(s => s.playing);
  const cross = useRef(onCross);
  cross.current = onCross;
  useEffect(() => {
    if (!playing) return;
    const st = useAtlas.getState();
    if (st.year >= 2026) st.setYear(-15000);
    let raf = 0, last = performance.now(), holdUntil = 0;
    const step = (t: number) => {
      const s = useAtlas.getState();
      if (!s.playing) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (t >= holdUntil) {
        const y = s.year;
        const ny = yearOf(Math.min(100, posOf(y) + dt * 1.55));
        const hit = NATIONAL.find(e => e.year > y && e.year <= ny);
        if (hit) { s.setYear(hit.year); holdUntil = t + 1300; cross.current(hit); }
        else s.setYear(ny === y ? y + 1 : ny);
        if (useAtlas.getState().year >= 2026) { s.setPlaying(false); return; }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}

export function AtlasView() {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<AtlasMap | null>(null);
  const year = useAtlas(s => s.year);
  const selection = useAtlas(s => s.selection);
  const focus = useAtlas(s => s.focus);
  const hintSeen = useAtlas(s => s.hintSeen);
  const [toast, setToast] = useState<{ e: HistEvent; k: number } | null>(null);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const m = new AtlasMap(host.current!, {
      onSelect: s => useAtlas.getState().select(s),
      onBackground: () => useAtlas.getState().select(null),
    });
    map.current = m;
    m.setYear(useAtlas.getState().year);
    return () => { m.destroy(); map.current = null; };
  }, []);

  useEffect(() => { map.current?.setYear(year); }, [year]);
  useEffect(() => { map.current?.setSelectedCanton(selection?.kind === 'canton' ? selection.code : null); }, [selection]);
  useEffect(() => {
    if (!focus || !map.current) return;
    const s = focus.sel!;
    if (s.kind === 'canton') map.current.zoomToCanton(s.code);
    else if (s.kind === 'city') map.current.zoomToPoint(CITIES[s.id].lat, CITIES[s.id].lon);
    else if (s.kind === 'event') { const e = EVENTS[s.id]; map.current.zoomToPoint(e.lat, e.lon, window.innerWidth < 900 ? 3.2 : 3.6); }
  }, [focus]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  usePlayback(e => setToast({ e, k: Date.now() }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === 'INPUT' && (tgt as HTMLInputElement).type !== 'range') return;
      const s = useAtlas.getState();
      if (e.key === ' ' && tgt.tagName !== 'BUTTON' && (tgt as HTMLInputElement).type !== 'range') { e.preventDefault(); s.setPlaying(!s.playing); }
      if (e.key === 'Escape') { if (search) setSearch(false); else s.select(null); }
      if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && !search) { e.preventDefault(); setSearch(true); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [search]);

  const panel = useMemo(() => panelFor(selection, year), [selection, year]);
  const lastPanel = useRef(panel);
  if (panel) lastPanel.current = panel;
  const shown = panel ?? lastPanel.current;

  return (
    <div className="atlas">
      <div className="map" ref={host}>
        <Header onSearch={() => setSearch(true)} />
        <div className="zoom">
          <button className="zbtn" onClick={() => map.current?.zoomIn()} aria-label="Zoomer">+</button>
          <button className="zbtn" onClick={() => map.current?.zoomOut()} aria-label="Dézoomer">−</button>
          <button className="zbtn" onClick={() => { useAtlas.getState().select(null); map.current?.zoomReset(); }} aria-label="Revenir à toute la Suisse">⤢</button>
        </div>
        {!hintSeen && <div className="hint">Glisse le temps, touche un canton ou un point.</div>}
        <div className="credit">Fonds : OFS GEOSTAT · Textes : d’après le DHS</div>
        {toast && (
          <div className="toast" key={toast.k}>
            <b>{fmtYear(toast.e.year)} · {toast.e.title}</b>
            <span>{NAMES[toast.e.code]}</span>
          </div>
        )}
        <aside className={`panel ${panel ? 'open' : ''}`} aria-live="polite" aria-hidden={!panel} onClick={e => e.stopPropagation()}>
          {shown && <>
            <div className="ptop">
              <div><div className="k">{shown.kicker}</div><h2>{shown.title}</h2></div>
              <button className="close" onClick={() => useAtlas.getState().select(null)} aria-label="Fermer">✕</button>
            </div>
            <div className="pbody" key={selection ? JSON.stringify(selection) : 'none'}>{shown.body}</div>
          </>}
        </aside>
      </div>
      <Dock />
      {search && <Search onClose={() => setSearch(false)} />}
    </div>
  );
}

