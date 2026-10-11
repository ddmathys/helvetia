/* Moteur de la carte « atlas de nuit » : D3 impératif (pas de rendu React par image pendant la lecture, spec §6.4). */
import * as d3 from 'd3';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { CITIES, EVENTS, LAKES, PEAKS, TYPES, type CantonCode, type City, type HistEvent } from '../lib/data';
import { cantonFeatures, countryFeature, lakeFeatures, mergeCantons, biggestPart, type CantonFeature } from '../lib/geo';
import { entityOf, shortLabel, statusAt } from '../lib/territories';
import { posOf } from '../lib/time';
import { cityName, lakeName } from '../lib/names';

export type Selection =
  | { kind: 'canton'; code: CantonCode }
  | { kind: 'city'; id: number }
  | { kind: 'lake'; id: number }
  | { kind: 'event'; id: number }
  | null;

interface Ent { key: string; label: string; fill: string; codes: CantonCode[]; ids: number[]; feature: Feature<MultiPolygon>; c: [number, number]; area: number }
interface EvVis extends HistEvent { recent: boolean }
type LakeF = Feature<Polygon | MultiPolygon> & { id: number };

const ALP: Partial<Record<CantonCode, number>> = { UR: 99, GR: 99, VS: 99, GL: 99, OW: 99, NW: 99, AI: 99, TI: 46.15, BE: 46.72, VD: 46.45, FR: 46.62, LU: 46.95, SZ: 47.06, SG: 47.2, AR: 47.38 };
const MAJOR = new Set(['Genève', 'Genava', 'Zurich', 'Turicum', 'Berne', 'Bâle', 'Basilia', 'Lugano', 'Lausanne', 'Augusta Raurica', 'Aventicum', 'Coire', 'Saint-Gall']);
const SWORD = 'M-7 -7L4 4M2 6L6 2M4 4L7.5 7.5M7 -7L-4 4M-2 6L-6 2M-4 4L-7.5 7.5';
export const PANEL_W = 440; // largeur réservée au panneau bureau (panneau + marges)

export interface AtlasCallbacks {
  onSelect: (s: Selection) => void;
  onBackground: () => void;
  onZoom?: (k: number) => void;
}

export class AtlasMap {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private defs; private root;
  private gEnt; private gSel; private gFlash; private gMtn; private gLake; private gBorder; private gLab; private gLakeLab; private gPeak; private gCity; private gEv;
  private proj = d3.geoMercator();
  private path = d3.geoPath(this.proj);
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private K = 1;
  private year = 1291;
  private lastYear: number | null = null;
  private selCode: CantonCode | null = null;
  private entSig = '';
  private ents: Ent[] = [];
  private ro: ResizeObserver;
  private mountains: [number, number, number][] = [];
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private host: HTMLElement;
  private cb: AtlasCallbacks;

  constructor(host: HTMLElement, cb: AtlasCallbacks) {
    this.host = host;
    this.cb = cb;
    this.svg = d3.select(host).append('svg').attr('role', 'img').attr('aria-label', 'Carte de la Suisse dans le temps');
    this.defs = this.svg.append('defs');
    this.root = this.svg.append('g');
    const g = (cls?: string) => this.root.append('g').attr('class', cls ?? null);
    this.gEnt = g(); this.gSel = g(); this.gFlash = g(); this.gMtn = g('mtn'); this.gLake = g(); this.gBorder = g();
    this.gLab = g(); this.gLakeLab = g(); this.gPeak = g(); this.gCity = g(); this.gEv = g();
    this.hatch('h-allie', '#b07c2a', '#f0b552');
    this.hatch('h-sujet', '#7b4368', '#b9709f');
    const glow = this.defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'b');
    const m = glow.append('feMerge'); m.append('feMergeNode').attr('in', 'b'); m.append('feMergeNode').attr('in', 'SourceGraphic');

    this.zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 10]).on('zoom', ev => {
      this.root.attr('transform', ev.transform.toString());
      const nk = ev.transform.k;
      this.defs.selectAll('pattern').attr('patternTransform', `rotate(45) scale(${1 / nk})`);
      const crossed = (this.K < 2.2) !== (nk < 2.2);
      this.K = nk;
      this.scaleMarks();
      if (crossed) this.drawEvents();
      cb.onZoom?.(nk);
    });
    this.svg.call(this.zoom).on('dblclick.zoom', null);
    this.svg.on('click', () => cb.onBackground());
    this.computeMountains();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(host);
    this.layout();
  }

  destroy() { this.ro.disconnect(); this.svg.remove(); }

  private get W() { return this.host.clientWidth; }
  private get H() { return this.host.clientHeight; }
  private get mobile() { return window.innerWidth < 900; }

  private hatch(id: string, c1: string, c2: string) {
    const p = this.defs.append('pattern').attr('id', id).attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7).attr('patternTransform', 'rotate(45)');
    p.append('rect').attr('width', 7).attr('height', 7).attr('fill', c1);
    p.append('rect').attr('width', 2.2).attr('height', 7).attr('fill', c2);
  }

  private layout() {
    const w = this.W, h = this.H;
    if (!w || !h) return;
    const top = Math.min(130, h * 0.24);
    this.proj.fitExtent([[16, top], [w - 16, h - 20]], countryFeature);
    this.svg.attr('viewBox', `0 0 ${w} ${h}`);
    this.entSig = '';
    this.gEnt.selectAll('path').remove();
    this.gBorder.selectAll('path').data([countryFeature]).join('path').attr('class', 'border').attr('d', d => this.path(d));
    this.drawMountains();
    this.drawPeaks();
    this.svg.call(this.zoom.transform, d3.zoomIdentity);
    this.render();
  }

  /* Relief : ~520 petits sommets semés de façon déterministe (graine fixe), calculés une fois */
  private computeMountains() {
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const alp = cantonFeatures.filter(f => ALP[f.code]);
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 5200 && pts.length < 520; i++) {
      const lon = 5.95 + rnd() * 4.55, lat = 45.82 + rnd() * 2.0;
      for (const f of alp) {
        const lim = ALP[f.code]!;
        const ok = f.code === 'TI' ? lat > lim : lat < lim;
        if (ok && d3.geoContains(f, [lon, lat])) { pts.push([lon, lat, 0.6 + rnd() * 0.7]); break; }
      }
    }
    pts.sort((a, b) => b[1] - a[1]);
    this.mountains = pts;
  }

  private drawMountains() {
    this.gMtn.selectAll<SVGGElement, [number, number, number]>('g').data(this.mountains).join(enter => {
      const g = enter.append('g');
      g.append('path').attr('d', 'M-6 3L0 -6L6 3Z').attr('fill', 'rgba(12,19,27,.35)');
      g.append('path').attr('d', 'M-2 -3L0 -6L2 -3L0 -2Z').attr('fill', 'rgba(238,242,245,.55)');
      return g;
    });
  }

  private drawPeaks() {
    this.gPeak.selectAll<SVGGElement, (typeof PEAKS)[number]>('g').data(PEAKS).join(e => {
      const g = e.append('g').attr('class', 'peak');
      g.append('path').attr('d', 'M-4 2L0 -5L4 2Z').attr('fill', '#dfe8f0');
      g.append('text').attr('class', 'n').attr('x', 6).attr('y', 0).text(d => d[2]);
      g.append('text').attr('class', 'a').attr('x', 6).attr('y', 11).text(d => d[3]);
      return g;
    });
    this.scaleMarks();
  }

  /* ============ API ============ */
  setYear(y: number) { this.year = y; this.render(); }

  setSelectedCanton(code: CantonCode | null) {
    if (this.selCode === code) return;
    this.selCode = code;
    this.drawSelection();
    this.drawEvents();
  }

  zoomIn() { this.svg.transition().duration(350).call(this.zoom.scaleBy, 1.6); }
  zoomOut() { this.svg.transition().duration(350).call(this.zoom.scaleBy, 1 / 1.6); }
  zoomReset() { this.svg.transition().duration(700).call(this.zoom.transform, d3.zoomIdentity); }

  /** Zoome sur un canton en le plaçant dans la zone visible (hors panneau). */
  zoomToCanton(code: CantonCode) {
    const f = cantonFeatures.find(c => c.code === code);
    if (!f) return;
    const [[x0, y0], [x1, y1]] = this.path.bounds(f);
    const w = this.W, h = this.H, mob = this.mobile;
    const vx0 = 16, vx1 = mob ? w - 16 : w - PANEL_W, vy0 = mob ? 100 : 110, vy1 = mob ? Math.max(vy0 + 120, window.innerHeight * 0.38 - 10) : h - 20;
    const k = Math.min(mob ? 5 : 7, 0.82 / Math.max((x1 - x0) / (vx1 - vx0), (y1 - y0) / (vy1 - vy0)));
    this.svg.transition().duration(this.reduced ? 0 : 850).call(this.zoom.transform, d3.zoomIdentity.translate((vx0 + vx1) / 2, (vy0 + vy1) / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
  }

  /** Zoome sur un point (ville, événement). */
  zoomToPoint(lat: number, lon: number, k?: number) {
    const [x, y] = this.proj([lon, lat])!;
    const w = this.W, h = this.H, mob = this.mobile;
    const kk = k ?? (mob ? 5 : 6);
    const cx = mob ? w / 2 : (w - PANEL_W) / 2, cy = mob ? Math.max(140, window.innerHeight * 0.24) : h / 2;
    this.svg.transition().duration(this.reduced ? 0 : 800).call(this.zoom.transform, d3.zoomIdentity.translate(cx, cy).scale(kk).translate(-x, -y));
  }

  /* ============ RENDU ============ */
  render() {
    if (!this.W) return;
    const year = this.year, pre = year < 1291;
    this.drawEntities();
    this.drawLakes();
    this.gBorder.select('path').classed('ghost', year < 1815);
    // éclat quand un territoire devient membre
    if (this.lastYear !== null && !pre && year > this.lastYear && year - this.lastYear < 60 && !this.reduced) {
      for (const f of cantonFeatures) {
        const a = statusAt(f.code, this.lastYear), b = statusAt(f.code, year);
        if (b && (!a || a[1] !== b[1]) && b[1] === 'membre') {
          this.gFlash.append('path').attr('class', 'flash').attr('d', this.path(f)).on('animationend', function () { this.remove(); });
        }
      }
    }
    this.drawCities();
    this.drawEvents();
    this.lastYear = year;
  }

  private drawEntities() {
    const year = this.year;
    const keys = cantonFeatures.map(f => entityOf(f.code, year));
    const sig = keys.map(k => k.key).join(';');
    if (sig === this.entSig) return; // mémoïsation : rien n'a changé
    this.entSig = sig;
    const groups = new Map<string, Omit<Ent, 'feature' | 'c' | 'area'>>();
    cantonFeatures.forEach((f, i) => {
      const e = keys[i];
      if (!groups.has(e.key)) groups.set(e.key, { key: e.key, label: e.label, fill: e.fill, codes: [], ids: [] });
      const g = groups.get(e.key)!;
      g.codes.push(f.code); g.ids.push(f.id);
    });
    this.ents = [...groups.values()].map(g => {
      const geom = mergeCantons(g.ids);
      const part = biggestPart(geom);
      return { ...g, feature: { type: 'Feature', properties: {}, geometry: geom }, c: this.path.centroid(part) as [number, number], area: this.path.area(part) };
    });
    this.gEnt.selectAll<SVGPathElement, Ent>('path').data(this.ents, d => d.key)
      .join(e => e.append('path').attr('class', 'cant').attr('tabindex', 0).attr('role', 'button').style('opacity', 0)
        .call(x => x.transition().duration(450).style('opacity', 1)))
      .attr('d', d => this.path(d.feature))
      .attr('fill', d => d.fill)
      .attr('aria-label', d => d.label || 'Territoire')
      .on('click', (ev: MouseEvent, d) => {
        ev.stopPropagation();
        const [x, y] = d3.pointer(ev, this.gEnt.node());
        const ll = this.proj.invert!([x, y])!;
        const f = cantonFeatures.find(c => d.codes.includes(c.code) && d3.geoContains(c, ll)) || cantonFeatures.find(c => d.codes.includes(c.code))!;
        this.cb.onSelect({ kind: 'canton', code: f.code });
      })
      .on('keydown', (ev: KeyboardEvent, d) => { if (ev.key === 'Enter') this.cb.onSelect({ kind: 'canton', code: d.codes[0] }); });
    this.gLab.selectAll<SVGTextElement, Ent>('text').data(this.ents.filter(d => d.label), d => d.key)
      .join('text').attr('class', 'clabel').attr('x', d => d.c[0]).attr('y', d => d.c[1] + 3).text(d => shortLabel(d.label));
    this.drawSelection();
    this.scaleMarks();
  }

  private drawSelection() {
    const sel = this.selCode ? cantonFeatures.find(c => c.code === this.selCode) : null;
    this.gSel.selectAll<SVGPathElement, CantonFeature>('path').data(sel ? [sel] : []).join('path').attr('class', 'selout').attr('d', d => this.path(d));
  }

  private drawLakes() {
    const year = this.year;
    const vis = (lakeFeatures as LakeF[]).filter(f => { const L = LAKES[f.id]; return !(L && L.made && year < L.made); });
    this.gLake.selectAll<SVGPathElement, LakeF>('path').data(vis, d => d.id)
      .join(e => e.append('path').attr('class', 'lake').style('opacity', 0).call(x => x.transition().duration(600).style('opacity', 1)))
      .attr('d', d => this.path(d))
      .on('click', (ev: MouseEvent, d) => { ev.stopPropagation(); this.cb.onSelect({ kind: 'lake', id: d.id }); });
    const labs = vis.map(f => ({ f, n: lakeName(f.id, year), c: this.path.centroid(biggestPart(f.geometry)), km2: LAKES[f.id]?.km2 ?? 0 })).filter(d => d.n);
    this.gLakeLab.selectAll<SVGGElement, (typeof labs)[number]>('g').data(labs, d => d.f.id)
      .join(e => {
        const g = e.append('g').attr('class', 'lakelab').style('opacity', 0);
        g.append('text').attr('class', 'ln'); g.append('text').attr('class', 'la');
        g.transition().duration(600).style('opacity', 1);
        return g;
      })
      .attr('transform', d => `translate(${d.c[0]},${d.c[1]})`)
      .call(g => { g.select('.ln').text(d => d.n!); g.select('.la').text(d => `${d.km2.toLocaleString('fr-CH')} km²`); });
    this.scaleMarks();
  }

  private drawCities() {
    const year = this.year;
    const list = CITIES.map(c => { const n = cityName(c, year); return n ? { ...c, n } : null; }).filter(Boolean) as (City & { n: string })[];
    this.gCity.selectAll<SVGGElement, City & { n: string }>('g').data(list, d => d.id)
      .join(
        e => {
          const g = e.append('g').attr('class', 'city').attr('tabindex', 0).attr('role', 'button').style('opacity', 0);
          g.append('circle').attr('class', 'hit'); g.append('circle').attr('class', 'pt'); g.append('text');
          g.on('click', (ev: MouseEvent, d) => { ev.stopPropagation(); this.cb.onSelect({ kind: 'city', id: d.id }); })
            .on('keydown', (ev: KeyboardEvent, d) => { if (ev.key === 'Enter') this.cb.onSelect({ kind: 'city', id: d.id }); });
          g.transition().duration(500).style('opacity', 1);
          return g;
        },
        u => u,
        x => x.transition().duration(300).style('opacity', 0).remove(),
      )
      .attr('aria-label', d => d.n)
      .attr('transform', d => { const [x, y] = this.proj([d.lon, d.lat])!; return `translate(${x},${y})`; })
      .select('text').text(d => d.n);
    this.scaleMarks();
  }

  private evVisible(e: HistEvent) {
    if (e.year > this.year) return false;
    return e.lvl === 1 || this.K >= 2.2 || e.code === this.selCode;
  }

  private drawEvents() {
    const P = posOf(this.year);
    const vis: EvVis[] = EVENTS.filter(e => this.evVisible(e)).map(e => ({ ...e, recent: P - posOf(e.year) < 3.2 }));
    this.gEv.selectAll<SVGGElement, EvVis>('g.ev').data(vis, d => d.id)
      .join(e => {
        const g = e.append('g').attr('class', 'ev').attr('tabindex', 0).attr('role', 'button');
        g.append('circle').attr('class', 'ring');
        g.append('circle').attr('class', 'dot');
        const b = g.append('g').attr('class', 'sword');
        b.append('circle').attr('r', 11);
        b.append('path').attr('d', SWORD);
        g.on('click', (ev: MouseEvent, d) => { ev.stopPropagation(); this.cb.onSelect({ kind: 'event', id: d.id }); })
          .on('keydown', (ev: KeyboardEvent, d) => { if (ev.key === 'Enter') this.cb.onSelect({ kind: 'event', id: d.id }); });
        g.attr('aria-label', d => `${d.year} : ${d.title}`);
        g.select('.dot').attr('r', 0).transition().duration(500).attr('r', d => this.dotR(d as EvVis));
        return g;
      })
      .attr('transform', d => { const [x, y] = this.proj([d.lon, d.lat])!; return `translate(${x},${y})`; })
      .classed('old', d => !d.recent)
      .classed('battle', d => d.type === 'bat')
      .call(g => {
        g.select('.dot').attr('fill', d => TYPES[d.type][1]).attr('r', d => this.dotR(d));
        g.select('.ring').attr('stroke', d => TYPES[d.type][1]).style('display', d => (d.recent ? null : 'none'));
      });
    this.scaleMarks();
  }

  private swS = (d: EvVis) => ((d.recent ? 0.95 : 0.7) * (d.lvl === 1 ? 1 : 0.85)) / Math.pow(this.K, 0.85);
  private dotR = (d: EvVis) => ((d.recent ? 6.5 : 4) * (d.lvl === 1 ? 1 : 0.85)) / Math.pow(this.K, 0.85);

  private scaleMarks() {
    const K = this.K, mob = this.W < 600;
    const cities = this.gCity.selectAll<SVGGElement, City & { n: string }>('g.city');
    cities.select('circle.pt').attr('r', 2.6 / K);
    cities.select('circle.hit').attr('r', 9 / K);
    cities.select('text').style('display', d => (K < (mob ? 2.6 : 1.7) && !MAJOR.has(d.n) ? 'none' : null))
      .attr('x', 5 / K).attr('y', 4 / K).style('font-size', 11.5 / K + 'px').style('stroke-width', 3 / K + 'px');
    this.gMtn.selectAll<SVGGElement, [number, number, number]>('g').attr('transform', d => { const [x, y] = this.proj([d[0], d[1]])!; return `translate(${x},${y}) scale(${d[2] / Math.pow(K, 0.75)})`; });
    this.gPeak.selectAll<SVGGElement, (typeof PEAKS)[number]>('g.peak').attr('transform', d => { const [x, y] = this.proj([d[1], d[0]])!; return `translate(${x},${y}) scale(${1 / K})`; }).style('display', () => (K >= 1.6 ? null : 'none'));
    this.gLab.selectAll<SVGTextElement, Ent>('text').style('font-size', d => Math.min(15, 9 + Math.sqrt(d.area) / 14) / K + 'px').style('stroke-width', 2.5 / K + 'px')
      .style('display', d => (d.area * K * K > (mob ? 9000 : 2600) ? null : 'none'));
    this.gLakeLab.selectAll<SVGGElement, { km2: number }>('g')
      .style('display', d => (d.km2 >= (mob ? 200 : 80) || K * K * d.km2 >= (mob ? 400 : 90) ? null : 'none'))
      .call(g => {
        g.select('.ln').style('font-size', 12 / K + 'px').style('stroke-width', 3 / K + 'px');
        g.select('.la').attr('y', 11 / K).style('font-size', 9 / K + 'px').style('stroke-width', 2.5 / K + 'px');
      });
    const evs = this.gEv.selectAll<SVGGElement, EvVis>('g.ev');
    evs.select('.dot').attr('r', d => this.dotR(d));
    evs.select('.ring').attr('r', d => (d.type === 'bat' ? 11 * this.swS(d) : this.dotR(d)));
    evs.select('.sword').attr('transform', d => `scale(${this.swS(d)})`);
  }
}
