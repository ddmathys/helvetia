/* Tableau de bord des fiches : thèmes en tuiles, recherche, filtres (canton, type, époque, période, tri). */
import { useDeferredValue, useMemo, useState } from 'react';
import { ALL_CODES, ERAS, NAMES, type CantonCode } from '../lib/data';
import { CATS, FICHES, byYear, ficheOfDay, searchFiches, type Cat, type Fiche } from '../lib/fiches';
import { fmtYear, fmtYearShort } from '../lib/time';
import { Portrait } from '../components/Portrait';
import { useApp } from '../state/app';
import { EMPTY, activeCount, useFilters, type Filters, type Sort } from '../state/filters';
import { todayKey } from '../quiz/rng';

const CAT_LIST = Object.keys(CATS) as Cat[];
const CANTONS_AZ = ALL_CODES.slice().sort((a, b) => NAMES[a].localeCompare(NAMES[b], 'fr'));
const SORTS: [Sort, string][] = [['chrono', 'Du plus ancien'], ['recent', 'Du plus récent'], ['alpha', 'De A à Z']];

/** Visuel d'une fiche : illustration, portrait dessiné ou, à défaut, une vignette typographique. */
export function FicheVisual({ f, big }: { f: Fiche; big?: boolean }) {
  if (f.illus) return <img src={big ? f.illus.src : f.illus.thumb} alt="" loading={big ? 'eager' : 'lazy'} decoding="async" />;
  if (f.portrait) return <div className="fv-portrait" style={{ background: f.portrait.bg }}><Portrait fig={f.portrait.fig} bg={f.portrait.bg} size={big ? 260 : 150} /></div>;
  return (
    <div className="fv-type" style={{ '--c': ERAS[f.era].color } as React.CSSProperties}>
      <span className="fv-y">{f.year !== null ? fmtYearShort(f.year) : CATS[f.cat].icon}</span>
      <span className="fv-k">{f.kind}</span>
    </div>
  );
}

export function FicheCard({ f }: { f: Fiche }) {
  return (
    <button className="fcard" onClick={() => useApp.getState().open(f.id)}>
      <div className="fimg"><FicheVisual f={f} /><span className="fcat">{CATS[f.cat].icon}</span></div>
      <div className="fmeta">
        <span className="fk"><i style={{ background: f.color }} />{f.kind}</span>
        <b>{f.title}</b>
        <small>{f.cat === 'tradition' ? f.dateLabel : f.year !== null ? fmtYearShort(f.year) : f.dateLabel} · {f.place}</small>
      </div>
    </button>
  );
}

/** Applique tous les filtres sauf ceux listés dans `skip` (pour compter les options disponibles). */
function apply(f: Filters, skip: (keyof Filters)[] = []): Fiche[] {
  const has = (k: keyof Filters) => !skip.includes(k);
  let l = FICHES.filter(x =>
    (!has('cat') || f.cat === 'all' || x.cat === f.cat) &&
    (!has('canton') || !f.canton || (x.codes.includes(f.canton) && x.codes.length < 20)) &&
    (!has('kinds') || !f.kinds.length || f.kinds.includes(x.kind)) &&
    (!has('era') || f.era === null || x.era === f.era) &&
    (!has('from') || f.from === null || (x.year !== null && x.year >= f.from)) &&
    (!has('to') || f.to === null || (x.year !== null && x.year <= f.to)));
  if (has('q')) l = searchFiches(f.q, l);
  return l;
}

function sortList(l: Fiche[], s: Sort) {
  const out = l.slice();
  if (s === 'alpha') return out.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  out.sort(byYear);
  return s === 'recent' ? out.reverse() : out;
}

/** Saisie d'année : « 1291 », « -58 » ou « 58 av ». */
function parseYear(s: string): number | null {
  const m = s.trim().match(/^(-?)\s*(\d{1,5})\s*(av)?/i);
  if (!m) return null;
  const n = parseInt(m[2]);
  return m[1] || m[3] ? -n : n;
}

function YearInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="yfield">
      <span>{label}</span>
      <input inputMode="numeric" placeholder={label === 'De' ? 'ex. 1291' : 'ex. 1848'} value={draft ?? (value === null ? '' : value < 0 ? `${-value} av` : String(value))}
        onChange={e => setDraft(e.target.value)} onBlur={() => { if (draft !== null) onChange(draft.trim() ? parseYear(draft) : null); setDraft(null); }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
    </label>
  );
}

function FilterSheet({ onClose }: { onClose: () => void }) {
  const f = useFilters();
  const count = apply(f).length;
  // compteurs : combien de fiches pour chaque option, compte tenu des autres filtres
  const byCanton = useMemo(() => {
    const l = apply(f, ['canton']), m = new Map<CantonCode, number>();
    for (const x of l) if (x.codes.length < 20) for (const c of x.codes) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [f]);
  const kinds = useMemo(() => {
    const m = new Map<string, { n: number; color: string }>();
    for (const x of apply(f, ['kinds'])) m.set(x.kind, { n: (m.get(x.kind)?.n ?? 0) + 1, color: x.color });
    for (const k of f.kinds) if (!m.has(k)) m.set(k, { n: 0, color: '#555' });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [f]);
  const byEra = useMemo(() => {
    const n = ERAS.map(() => 0);
    for (const x of apply(f, ['era'])) n[x.era]++;
    return n;
  }, [f]);
  const toggleKind = (k: string) => f.set({ kinds: f.kinds.includes(k) ? f.kinds.filter(x => x !== k) : [...f.kinds, k] });

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Filtres" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <b>Filtres</b>
          <button className="linkbtn" onClick={() => f.set({ ...EMPTY, q: f.q, cat: f.cat })}>Tout effacer</button>
        </div>
        <div className="sheet-body">
          <section>
            <h4>Thème</h4>
            <div className="chips">
              <button className={`chipbtn ${f.cat === 'all' ? 'on' : ''}`} onClick={() => f.set({ cat: 'all', kinds: [] })}>Tout</button>
              {CAT_LIST.map(c => <button key={c} className={`chipbtn ${f.cat === c ? 'on' : ''}`} onClick={() => f.set({ cat: c, kinds: [] })}>{CATS[c].icon} {CATS[c].plural}</button>)}
            </div>
          </section>
          <section>
            <h4>Canton</h4>
            <select className="select" value={f.canton ?? ''} onChange={e => f.set({ canton: (e.target.value || null) as CantonCode | null })}>
              <option value="">Tous les cantons</option>
              {CANTONS_AZ.map(c => <option key={c} value={c}>{NAMES[c]} ({byCanton.get(c) ?? 0})</option>)}
            </select>
          </section>
          <section>
            <h4>Type</h4>
            <div className="chips">
              {kinds.map(([k, v]) => (
                <button key={k} className={`chipbtn ${f.kinds.includes(k) ? 'on' : ''}`} onClick={() => toggleKind(k)} disabled={!v.n && !f.kinds.includes(k)}>
                  <i className="dot" style={{ background: v.color }} />{k} <small>{v.n}</small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h4>Époque</h4>
            <div className="chips">
              {ERAS.map((e, i) => (
                <button key={i} className={`chipbtn ${f.era === i ? 'on' : ''}`} onClick={() => f.set({ era: f.era === i ? null : i })} disabled={!byEra[i] && f.era !== i}>
                  <i className="dot" style={{ background: e.color }} />{e.name} <small>{byEra[i]}</small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h4>Période</h4>
            <div className="years">
              <YearInput label="De" value={f.from} onChange={from => f.set({ from })} />
              <YearInput label="À" value={f.to} onChange={to => f.set({ to })} />
            </div>
            <small className="muted">Années avant J.-C. : écris « 58 av » ou « -58 ».</small>
          </section>
          <section>
            <h4>Trier</h4>
            <div className="chips">
              {SORTS.map(([s, l]) => <button key={s} className={`chipbtn ${f.sort === s ? 'on' : ''}`} onClick={() => f.set({ sort: s })}>{l}</button>)}
            </div>
          </section>
        </div>
        <div className="sheet-foot">
          <button className="primary" onClick={onClose}>Voir {count} fiche{count > 1 ? 's' : ''}</button>
        </div>
      </div>
    </div>
  );
}

export function FichesView() {
  const f = useFilters();
  const dq = useDeferredValue(f.q);
  const [sheet, setSheet] = useState(false);
  const daily = useMemo(() => ficheOfDay(todayKey()), []);
  const fd = useMemo(() => ({ ...f, q: dq }), [f, dq]);
  const list = useMemo(() => sortList(apply(fd), fd.sort), [fd]);
  const catCounts = useMemo(() => {
    const l = apply(fd, ['cat']);
    return Object.fromEntries(CAT_LIST.map(c => [c, l.filter(x => x.cat === c).length])) as Record<Cat, number>;
  }, [fd]);
  const total = CAT_LIST.reduce((a, c) => a + catCounts[c], 0);
  const n = activeCount(f);
  const filtering = !!dq || f.cat !== 'all' || n > 0;

  // en ordre chronologique, on regroupe par époque ; sinon une grille simple
  const groups = useMemo(() => {
    if (f.sort === 'alpha') return [{ key: 'all', title: '', color: '', items: list }];
    const out: { key: string; title: string; color: string; items: Fiche[] }[] = [];
    for (const x of list) {
      const last = out[out.length - 1];
      if (last?.key === `e${x.era}`) last.items.push(x);
      else out.push({ key: `e${x.era}`, title: ERAS[x.era].name, color: ERAS[x.era].color, items: [x] });
    }
    return out;
  }, [list, f.sort]);

  const chips: { label: string; clear: () => void }[] = [];
  if (f.canton) chips.push({ label: `📍 ${NAMES[f.canton]}`, clear: () => f.set({ canton: null }) });
  for (const k of f.kinds) chips.push({ label: k, clear: () => f.set({ kinds: f.kinds.filter(x => x !== k) }) });
  if (f.era !== null) chips.push({ label: ERAS[f.era].name, clear: () => f.set({ era: null }) });
  if (f.from !== null || f.to !== null) chips.push({
    label: `📅 ${f.from !== null ? fmtYear(f.from) : '…'} → ${f.to !== null ? fmtYear(f.to) : '…'}`, clear: () => f.set({ from: null, to: null }),
  });

  return (
    <div className="page lib">
      <div className="page-in">
        <div>
          <h3 className="brand-h"><img src="/logo.svg" alt="" />Helvetia</h3>
          <h1>L’histoire suisse, <em>fiche par fiche</em>.</h1>
        </div>

        <div className="tiles">
          <button className={`tile ${f.cat === 'all' ? 'on' : ''}`} onClick={() => f.set({ cat: 'all', kinds: [] })}>
            <span className="tn">{total}</span><span className="tl">Toutes les fiches</span>
          </button>
          {CAT_LIST.map(c => (
            <button key={c} className={`tile ${f.cat === c ? 'on' : ''}`} onClick={() => f.set({ cat: f.cat === c ? 'all' : c, kinds: [] })}>
              <span className="ti">{CATS[c].icon}</span><span className="tn">{catCounts[c]}</span><span className="tl">{CATS[c].plural}</span>
            </button>
          ))}
        </div>

        <div className="libbar">
          <div className="lrow">
            <label className="lsearch">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <input type="search" value={f.q} onChange={e => f.set({ q: e.target.value })} placeholder="Chercher : Morgarten, raclette…" aria-label="Chercher une fiche" />
            </label>
            <button className={`fbtn ${n ? 'on' : ''}`} onClick={() => setSheet(true)} aria-label="Ouvrir les filtres">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
              Filtres{n ? <span className="badge-n">{n}</span> : null}
            </button>
          </div>
          <div className="scroller">
            <select className="mini-select" value={f.canton ?? ''} onChange={e => f.set({ canton: (e.target.value || null) as CantonCode | null })} aria-label="Canton">
              <option value="">📍 Canton</option>
              {CANTONS_AZ.map(c => <option key={c} value={c}>{NAMES[c]}</option>)}
            </select>
            <select className="mini-select" value={f.era ?? ''} onChange={e => f.set({ era: e.target.value === '' ? null : +e.target.value })} aria-label="Époque">
              <option value="">🕰️ Époque</option>
              {ERAS.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
            </select>
            <select className="mini-select" value={f.sort} onChange={e => f.set({ sort: e.target.value as Sort })} aria-label="Tri">
              {SORTS.map(([s, l]) => <option key={s} value={s}>↕ {l}</option>)}
            </select>
          </div>
          {(chips.length > 0 || filtering) && (
            <div className="active">
              <span className="count">{list.length} fiche{list.length > 1 ? 's' : ''}</span>
              {chips.map(c => <button key={c.label} className="achip" onClick={c.clear}>{c.label} ✕</button>)}
              {filtering && <button className="linkbtn" onClick={() => f.reset()}>Tout effacer</button>}
            </div>
          )}
        </div>

        {!filtering && (
          <button className="daily-fiche" onClick={() => useApp.getState().open(daily.id)}>
            <div className="dimg"><FicheVisual f={daily} big /></div>
            <div className="dtxt">
              <span className="pill">Fiche du jour</span>
              <b>{daily.title}</b>
              <small>{daily.kind} · {daily.dateLabel} · {daily.place}</small>
            </div>
          </button>
        )}

        {list.length === 0 && (
          <div className="empty">
            <p>Aucune fiche ne correspond à ces filtres.</p>
            <button className="ghost" onClick={() => f.reset()}>Tout effacer</button>
          </div>
        )}
        {groups.map(g => (
          <section key={g.key} className="fgroup">
            {g.title && <h2 className="ghead"><i style={{ background: g.color }} />{g.title}<span>{g.items.length}</span></h2>}
            <div className="fgrid">{g.items.map(x => <FicheCard key={x.id} f={x} />)}</div>
          </section>
        ))}
      </div>
      {sheet && <FilterSheet onClose={() => setSheet(false)} />}
    </div>
  );
}
