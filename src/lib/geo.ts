import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { geoArea } from 'd3';
import topoJson from '../data/switzerland.topo.json';
import { CODES, type CantonCode } from './data';

export const TOPO = topoJson as unknown as Topology<{ country: GeometryCollection; cantons: GeometryCollection; lakes: GeometryCollection }>;

export type CantonFeature = Feature<Polygon | MultiPolygon> & { id: number; code: CantonCode };

export const CANTON_GEOMS = TOPO.objects.cantons.geometries;

export const cantonFeatures: CantonFeature[] = (topojson.feature(TOPO, TOPO.objects.cantons) as FeatureCollection<Polygon | MultiPolygon>).features
  .map(f => Object.assign(f, { code: CODES[String(f.id)] }) as CantonFeature);

export const lakeFeatures = (topojson.feature(TOPO, TOPO.objects.lakes) as FeatureCollection<Polygon | MultiPolygon>).features as (Feature<Polygon | MultiPolygon> & { id: number })[];

export const countryFeature = topojson.feature(TOPO, TOPO.objects.country) as unknown as FeatureCollection<Geometry>;

export const cantonByCode = new Map(cantonFeatures.map(f => [f.code, f]));

/** Fusion des cantons actuels d'une entité en une seule forme. */
export function mergeCantons(ids: number[]): MultiPolygon {
  return topojson.merge(TOPO, CANTON_GEOMS.filter(g => ids.includes(g.id as number)) as never);
}

/** Plus grande partie d'une (multi)polygone, pour placer l'étiquette. */
export function biggestPart(g: Polygon | MultiPolygon): Polygon {
  if (g.type === 'Polygon') return g;
  let best: Polygon | null = null, ba = -1;
  for (const c of g.coordinates) {
    const poly: Polygon = { type: 'Polygon', coordinates: c };
    const a = geoArea(poly);
    if (a > ba) { ba = a; best = poly; }
  }
  return best!;
}

/** Distance en km (haversine). */
export function km(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
