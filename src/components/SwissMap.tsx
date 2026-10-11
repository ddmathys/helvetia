/* Carte légère (React + d3-geo) pour le quiz : cantons actuels cliquables, épingles, lignes. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { geoMercator, geoPath, pointer } from 'd3';
import { NAMES, type CantonCode } from '../lib/data';
import { biggestPart, cantonFeatures, countryFeature, lakeFeatures } from '../lib/geo';

export interface Marker { lat: number; lon: number; color: string; label?: string; key: string; className?: string }

interface Props {
  className?: string;
  fill?: (code: CantonCode) => string | undefined;
  cls?: (code: CantonCode) => string;
  labels?: boolean | ((code: CantonCode) => string | null);
  onCanton?: (code: CantonCode) => void;
  onPoint?: (lat: number, lon: number) => void;
  markers?: Marker[];
  lines?: { from: [number, number]; to: [number, number] }[];
  hoverLabel?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function SwissMap({ className = 'qmap', fill, cls, labels, onCanton, onPoint, markers = [], lines = [], hoverLabel, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<CantonCode | null>(null);

  useLayoutEffect(() => {
    const r = ref.current!.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);

  const { path, proj } = useMemo(() => {
    const proj = geoMercator().fitExtent([[10, 10], [Math.max(20, size.w - 10), Math.max(20, size.h - 10)]], countryFeature);
    return { proj, path: geoPath(proj) };
  }, [size]);

  const cents = useMemo(() => new Map(cantonFeatures.map(f => [f.code, path.centroid(biggestPart(f.geometry))])), [path]);
  const pt = (lat: number, lon: number) => proj([lon, lat]) ?? [0, 0];

  return (
    <div className={className} ref={ref}>
      {size.w > 0 && (
        <svg ref={svg} viewBox={`0 0 ${size.w} ${size.h}`} role="img" aria-label="Carte des cantons suisses"
          onClick={e => {
            if (disabled || !onPoint) return;
            const [x, y] = pointer(e, svg.current);
            const ll = proj.invert!([x, y]);
            if (ll) onPoint(ll[1], ll[0]);
          }}>
          {cantonFeatures.map(f => (
            <path key={f.code} d={path(f) ?? ''} className={`qc ${cls?.(f.code) ?? ''}`} style={fill ? { fill: fill(f.code) } : undefined}
              role={onCanton ? 'button' : undefined} tabIndex={onCanton && !disabled ? 0 : undefined} aria-label={NAMES[f.code]}
              onMouseEnter={() => setHover(f.code)} onMouseLeave={() => setHover(h => (h === f.code ? null : h))}
              onClick={() => { if (!disabled) onCanton?.(f.code); }}
              onKeyDown={e => { if (e.key === 'Enter' && !disabled) onCanton?.(f.code); }} />
          ))}
          {lakeFeatures.filter(l => (l.id as number) !== 9216 && (l.id as number) !== 9276).map(l => <path key={l.id} d={path(l) ?? ''} className="ql" />)}
          <path d={path(countryFeature) ?? ''} fill="none" stroke="#5c7189" strokeWidth={1.2} pointerEvents="none" />
          {labels && cantonFeatures.map(f => {
            const t = typeof labels === 'function' ? labels(f.code) : f.code;
            const c = cents.get(f.code)!;
            return t ? <text key={f.code} className="qlab" x={c[0]} y={c[1] + 3}>{t}</text> : null;
          })}
          {lines.map((l, i) => { const a = pt(...l.from), b = pt(...l.to); return <line key={i} className="cg-line" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />; })}
          {markers.map(m => {
            const [x, y] = pt(m.lat, m.lon);
            return (
              <g key={m.key} transform={`translate(${x},${y})`} pointerEvents="none">
                <g className={m.className ?? 'cg-pin'}>
                  <circle r={11} fill={m.color} opacity={0.25} />
                  <circle r={5.5} fill={m.color} stroke="#0c131b" strokeWidth={2} />
                  {m.label && <text x={10} y={-9} className="qlab" style={{ textAnchor: 'start', fontSize: 11 }}>{m.label}</text>}
                </g>
              </g>
            );
          })}
        </svg>
      )}
      {hoverLabel && hover && <div className="hov">{NAMES[hover]}</div>}
    </div>
  );
}
