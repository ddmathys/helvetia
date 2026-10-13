/* Une fiche en plein écran : illustration, récit, repères, carte de situation, pour aller plus loin, quiz. */
import { useEffect, useRef, useState } from 'react';
import { ERAS, WAR } from '../lib/data';
import { CATS, FICHE_BY_ID, relatedFiches, type Fiche } from '../lib/fiches';
import { fmtYear } from '../lib/time';
import { Locator } from '../components/Locator';
import { useApp } from '../state/app';
import { useQuiz } from '../state/quiz';
import { FACTORIES } from '../quiz/bank';
import { FicheCard, FicheVisual } from './Fiches';

function Facts({ items }: { items: [string, string | number | null | undefined][] }) {
  const list = items.filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== '—');
  return <div className="facts">{list.map(([k, v]) => <div key={k} className="fact"><small>{k}</small><b>{v}</b></div>)}</div>;
}

function Details({ f }: { f: Fiche }) {
  if (f.cat === 'evenement') {
    const w = WAR[f.title];
    return (
      <>
        <Facts items={[['Date', f.dateLabel], ['Où', f.place], ['Thème', f.kind], ['Époque', ERAS[f.era].name]]} />
        {w && (
          <div className="war">
            <span className="wname">{w[0]}</span>
            <div className="sides"><span><b>CAMP A</b><br />{w[1]}</span><span>⚔️</span><span><b>CAMP B</b><br />{w[2]}</span></div>
            <span className="win">Vainqueur : <strong>{w[3]}</strong></span>
          </div>
        )}
      </>
    );
  }
  if (f.cat === 'lieu') {
    const c = f.city!;
    return (
      <>
        <Facts items={[['Canton', f.place], ['Habitants', c.pop ? c.pop.toLocaleString('fr-CH') : null], ['Première mention', f.year !== null ? fmtYear(f.year) : null]]} />
        {c.names.filter(n => n[1]).length > 1 && (
          <>
            <div className="sub">Ses noms au fil du temps</div>
            <div className="hist">
              {c.names.filter(n => n[1]).map(([y, n], i, a) => (
                <div key={y} className={i === a.length - 1 ? 'now' : ''} style={{ '--c': ERAS[Math.min(8, Math.max(0, f.era + i))].color } as React.CSSProperties}>
                  <b>{y < 0 ? fmtYear(y) : `dès ${y}`}</b>{n}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }
  if (f.cat === 'tradition') {
    const t = f.trad!;
    return <Facts items={[['Quand', t.when], ['Où', t.place], ['Type', t.kind], ['Depuis', t.since ? String(t.since) : null]]} />;
  }
  const p = f.people!;
  return (
    <>
      <Facts items={p.facts} />
      <div className="sub">Croyances</div>
      <p>{p.belief}</p>
      <div className="know"><span>Le saviez-vous ?</span><p>{p.fact}</p></div>
      {p.see.length > 0 && (
        <>
          <div className="sub">À voir</div>
          <ul className="see">{p.see.map(s => <li key={s}>{s}</li>)}</ul>
        </>
      )}
    </>
  );
}

export function FichePage({ id }: { id: string }) {
  const f = FICHE_BY_ID.get(id)!;
  const ref = useRef<HTMLDivElement>(null);
  const [shared, setShared] = useState(false);
  const close = useApp(s => s.close);
  const related = relatedFiches(f, 6);
  const nq = FACTORIES.filter(x => x.fiche === f.id).length;

  useEffect(() => { ref.current?.scrollTo(0, 0); setShared(false); }, [id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [close]);

  const share = async () => {
    const url = `${location.origin}/?f=${f.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${f.title} · Helvetia`, url });
      else { await navigator.clipboard.writeText(url); setShared(true); }
    } catch { /* partage annulé */ }
  };
  const quiz = () => useQuiz.getState().start({ mode: 'fiche', fiches: [f.id, ...related.map(r => r.id)] });

  return (
    <div className="fpage" ref={ref} role="dialog" aria-modal="true" aria-label={f.title}>
      <div className="fbar">
        <button className="round" onClick={close} aria-label="Retour">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="fbar-k">{CATS[f.cat].icon} {CATS[f.cat].label}</span>
        <button className="round" onClick={share} aria-label="Partager la fiche">
          <svg viewBox="0 0 24 24"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <article className="fdoc">
        <figure className={`fhero ${f.illus ? 'photo' : ''}`} style={f.illus ? { aspectRatio: String(Math.max(1.05, Math.min(1.9, f.illus.ratio))) } : undefined}>
          <FicheVisual f={f} big />
          {f.illus && (
            <figcaption>
              <a href={f.illus.source} target="_blank" rel="noopener">{f.illus.artist} · {f.illus.license} · Wikimedia Commons</a>
            </figcaption>
          )}
        </figure>

        <div className="fbody">
          <div className="fkick"><i style={{ background: ERAS[f.era].color }} />{f.kind} · {ERAS[f.era].name}</div>
          <h1>{f.title}</h1>
          <div className="fwhen">{f.dateLabel}{f.place ? ` · ${f.place}` : ''}</div>
          <p className="flead">{f.text}</p>

          <Details f={f} />

          <div className="sub">Où ?</div>
          <Locator codes={f.codes} lat={f.lat} lon={f.lon} />

          {f.wiki?.extract && (
            <div className="further">
              <div className="sub">Pour aller plus loin</div>
              <p>{f.wiki.extract}</p>
              <a href={f.wiki.url} target="_blank" rel="noopener">Article « {f.wiki.page} » sur Wikipédia (CC BY-SA) ↗</a>
            </div>
          )}
          {f.wiki && !f.wiki.extract && (
            <a className="further-link" href={f.wiki.url} target="_blank" rel="noopener">En savoir plus sur Wikipédia ↗</a>
          )}

          {nq > 0 && (
            <button className="cta" onClick={quiz}>
              <span className="big">🎯</span>
              <span style={{ flex: 1 }}>
                <b>Teste-toi sur cette fiche</b>
                <small>5 questions sur « {f.title} » et les fiches voisines</small>
              </span>
            </button>
          )}
          {shared && <span className="muted">Lien copié.</span>}

          <div className="sub">Fiches liées</div>
          <div className="frel">{related.map(r => <FicheCard key={r.id} f={r} />)}</div>
        </div>
      </article>
    </div>
  );
}
