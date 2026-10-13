/* Bibliothèque de fiches : recherche, thèmes, époques, et la fiche du jour. */
import { useDeferredValue, useMemo, useState } from 'react';
import { ERAS } from '../lib/data';
import { CATS, FICHES, byYear, ficheOfDay, searchFiches, type Cat, type Fiche } from '../lib/fiches';
import { fmtYearShort } from '../lib/time';
import { Portrait } from '../components/Portrait';
import { useApp } from '../state/app';
import { todayKey } from '../quiz/rng';

const CAT_ORDER: (Cat | 'all')[] = ['all', 'evenement', 'lieu', 'tradition', 'peuple'];

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
      <div className="fimg"><FicheVisual f={f} /></div>
      <div className="fmeta">
        <span className="fk"><i style={{ background: f.color }} />{f.kind}</span>
        <b>{f.title}</b>
        <small>{f.cat === 'tradition' ? f.dateLabel : f.year !== null ? fmtYearShort(f.year) : f.dateLabel} · {f.place}</small>
      </div>
    </button>
  );
}

export function FichesView() {
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [era, setEra] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const daily = useMemo(() => ficheOfDay(todayKey()), []);

  const list = useMemo(() => {
    let l = FICHES.filter(f => (cat === 'all' || f.cat === cat) && (era === null || f.era === era));
    l = searchFiches(dq, l);
    return l.slice().sort(byYear);
  }, [cat, era, dq]);

  // groupes par époque (sauf traditions, rangées par type)
  const groups = useMemo(() => {
    const m = new Map<string, { title: string; color: string; items: Fiche[] }>();
    for (const f of list) {
      const key = f.cat === 'tradition' && cat === 'tradition' ? `k${f.kind}` : `e${f.era}`;
      const g = m.get(key) ?? { title: key[0] === 'k' ? f.kind : ERAS[f.era].name, color: key[0] === 'k' ? f.color : ERAS[f.era].color, items: [] };
      g.items.push(f);
      m.set(key, g);
    }
    return [...m.values()];
  }, [list, cat]);

  const filtering = !!dq || cat !== 'all' || era !== null;

  return (
    <div className="page lib">
      <div className="page-in">
        <div>
          <h3>Helvetia</h3>
          <h1>L’histoire suisse, <em>fiche par fiche</em>.</h1>
          <p className="lead">{FICHES.length} fiches illustrées sur les événements, les lieux, les traditions et les peuples qui ont fait la Suisse. Lis, puis teste-toi : chaque quiz est tiré de ces fiches.</p>
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

        <div className="libbar">
          <label className="lsearch">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher : Morgarten, raclette, Genève…" aria-label="Chercher une fiche" />
          </label>
          <div className="scroller" role="tablist" aria-label="Thèmes">
            {CAT_ORDER.map(c => (
              <button key={c} role="tab" aria-selected={cat === c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c === 'all' ? 'Tout' : `${CATS[c].icon} ${CATS[c].plural}`}
              </button>
            ))}
          </div>
          <div className="scroller" aria-label="Époques">
            <button className={`era-chip ${era === null ? 'on' : ''}`} onClick={() => setEra(null)}>Toutes les époques</button>
            {ERAS.map((e, i) => (
              <button key={i} className={`era-chip ${era === i ? 'on' : ''}`} onClick={() => setEra(era === i ? null : i)} style={{ '--c': e.color } as React.CSSProperties}>
                <i />{e.short}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 && <p className="muted">Aucune fiche ne correspond. Essaie un autre mot ou une autre époque.</p>}
        {groups.map(g => (
          <section key={g.title} className="fgroup">
            <h2 className="ghead"><i style={{ background: g.color }} />{g.title}<span>{g.items.length}</span></h2>
            <div className="fgrid">{g.items.map(f => <FicheCard key={f.id} f={f} />)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
