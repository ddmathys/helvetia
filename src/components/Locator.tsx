/* Petite carte de repère, volontairement simple : la Suisse, ses cantons en filigrane,
   la région de la fiche en surbrillance et un point. Tout en SVG vectoriel, donc net sur tous les écrans. */
import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import { NAMES, type CantonCode } from '../lib/data';
import { cantonFeatures, countryFeature, lakeFeatures } from '../lib/geo';

const W = 320, H = 206;
const proj = geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], countryFeature);
const path = geoPath(proj);
const CANTON_D = new Map(cantonFeatures.map(f => [f.code, path(f) ?? '']));
const BIG_LAKES = lakeFeatures.filter(l => ![9216, 9276].includes(l.id)).map(l => path(l) ?? '');
const COUNTRY_D = path(countryFeature as never) ?? '';

export function Locator({ codes, lat, lon, label, compact }: { codes: CantonCode[]; lat?: number; lon?: number; label?: string; compact?: boolean }) {
  const all = codes.length === 0 || codes.length >= 20;
  const on = useMemo(() => new Set(all ? [] : codes), [codes, all]);
  const pt = lat !== undefined && lon !== undefined ? proj([lon, lat]) : null;
  const caption = label ?? (all ? 'Toute la Suisse' : codes.length > 3 ? `${codes.length} cantons` : codes.map(c => NAMES[c]).join(' · '));
  return (
    <figure className={`locator ${compact ? 'compact' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Situation : ${caption}`}>
        {cantonFeatures.map(f => <path key={f.code} d={CANTON_D.get(f.code)} className={all || on.has(f.code) ? 'lc on' : 'lc'} />)}
        {BIG_LAKES.map((d, i) => <path key={i} d={d} className="ll" />)}
        <path d={COUNTRY_D} className="lb" />
        {pt && (
          <g transform={`translate(${pt[0]},${pt[1]})`}>
            <circle r={9} className="lp-halo" />
            <circle r={4.2} className="lp" />
          </g>
        )}
      </svg>
      {!compact && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
