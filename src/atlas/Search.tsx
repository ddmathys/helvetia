import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CODES, CITIES, EVENTS, LAKES, NAMES } from '../lib/data';
import { cityNow } from '../lib/names';
import { fmtYearShort } from '../lib/time';
import { useAtlas } from '../state/atlas';
import type { Selection } from '../map/AtlasMap';

interface Item { type: string; label: string; year?: number; sel: Selection; jump?: number; norm: string }

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const ITEMS: Item[] = [
  ...ALL_CODES.map(c => ({ type: 'Canton', label: NAMES[c], sel: { kind: 'canton' as const, code: c }, norm: norm(NAMES[c] + ' ' + c) })),
  ...EVENTS.map(e => ({ type: e.type === 'bat' ? 'Bataille' : 'Événement', label: e.title, year: e.year, sel: { kind: 'event' as const, id: e.id }, jump: e.year, norm: norm(`${e.title} ${e.year} ${NAMES[e.code]}`) })),
  ...CITIES.map(c => ({ type: 'Ville', label: cityNow(c), sel: { kind: 'city' as const, id: c.id }, jump: c.names[0][0], norm: norm(c.names.map(n => n[1] ?? '').join(' ')) })),
  ...Object.entries(LAKES).map(([id, L]) => ({ type: 'Lac', label: L.names[L.names.length - 1][1], sel: { kind: 'lake' as const, id: +id }, jump: L.made, norm: norm(L.names.map(n => n[1]).join(' ')) })),
];

export function Search({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [act, setAct] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const res = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return ITEMS.filter(i => i.type === 'Canton').slice(0, 8).concat(ITEMS.filter(i => i.type === 'Bataille').slice(0, 6));
    const words = n.split(/\s+/);
    return ITEMS.filter(i => words.every(w => i.norm.includes(w)))
      .sort((a, b) => Number(!b.norm.startsWith(words[0])) - Number(!a.norm.startsWith(words[0])))
      .slice(0, 40);
  }, [q]);

  const go = (i: Item) => {
    const s = useAtlas.getState();
    s.setPlaying(false);
    if (i.jump !== undefined && (i.type === 'Événement' || i.type === 'Bataille' || s.year < i.jump)) s.setYear(i.jump);
    s.select(i.sel);
    onClose();
  };

  return (
    <div className="search-bg" onClick={onClose}>
      <div className="search" onClick={e => e.stopPropagation()} role="dialog" aria-label="Rechercher dans l’atlas">
        <input ref={input} value={q} placeholder="Canton, bataille, ville, lac, année…" aria-label="Recherche"
          onChange={e => { setQ(e.target.value); setAct(0); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setAct(a => Math.min(res.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setAct(a => Math.max(0, a - 1)); }
            if (e.key === 'Enter' && res[act]) go(res[act]);
            if (e.key === 'Escape') onClose();
          }} />
        <ul>
          {res.map((i, k) => (
            <li key={i.type + i.label + k}>
              <button className={k === act ? 'act' : ''} onMouseEnter={() => setAct(k)} onClick={() => go(i)}>
                <span className="t">{i.type}</span><span>{i.label}</span>{i.year !== undefined && <span className="y">{fmtYearShort(i.year)}</span>}
              </button>
            </li>
          ))}
          {!res.length && <li className="muted" style={{ padding: 12 }}>Rien trouvé.</li>}
        </ul>
      </div>
    </div>
  );
}
