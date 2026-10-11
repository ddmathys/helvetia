/* Données de contenu (spec §8), extraites du prototype par scripts/extract-data.mjs. Ne pas réécrire les textes. */
import core from '../data/core.json';
import eventsJson from '../data/events.json';
import warsJson from '../data/wars.json';
import citiesJson from '../data/cities.json';
import lakesJson from '../data/lakes.json';
import peoplesJson from '../data/peoples.json';
import cantonsJson from '../data/cantons.json';

export type CantonCode = 'ZH'|'BE'|'LU'|'UR'|'SZ'|'OW'|'NW'|'GL'|'ZG'|'FR'|'SO'|'BS'|'BL'|'SH'|'AR'|'AI'|'SG'|'GR'|'AG'|'TG'|'TI'|'VD'|'VS'|'NE'|'GE'|'JU';
export type Status = 'membre'|'allie'|'sujet'|'etranger'|'helv'|'fr';
export type EvType = 'arch'|'fond'|'bat'|'pol'|'rel'|'cat'|'cult';

export interface Era { name: string; short: string; color: string }
export interface PreEra { from: number; to: number; note: string; groups: Record<string, [string, string]>; map?: Record<string, string> }
export type TimelineEntry = [number, Status, string];
export interface HistEvent { id: number; year: number; lat: number; lon: number; code: CantonCode; type: EvType; lvl: 1|2; title: string; text: string }
export type War = [string, string, string, string];
export interface City { id: number; code: CantonCode; lat: number; lon: number; pop?: number; names: [number, string|null][]; info: string }
export interface Lake { names: [number, string][]; km2: number; m?: number; note: string; made?: number }
export interface PortraitParams {
  skin: string; hair?: string; hairC: string; beard?: string; garment: string; pattern?: boolean; cloak?: string; fur?: boolean;
  fibula?: boolean; torc?: string; necklace?: boolean; buckle?: boolean; cross?: boolean; hat?: string; hatC?: string; female?: boolean;
}
export interface PeopleInfo { kind: string; who: string; facts: [string, string][]; life: string; belief: string; fact: string; see: string[]; fig: PortraitParams }
export interface CantonInfo { cap: string; pop: number; km2: number; lang: string; trad: string; food: string; people: string }

export const CODES = core.CODES as Record<string, CantonCode>;
export const NAMES = core.NAMES as Record<CantonCode, string>;
export const ALL_CODES = Object.values(CODES);
export const BP: number[] = core.BP;
export const PC: number[] = core.PC;
export const ERAS = core.ERAS as Era[];
export const PRE = core.PRE as unknown as PreEra[];
export const ST = core.ST as unknown as Record<Status, [string, string, string]>;
export const TL = core.TL as unknown as Record<CantonCode, TimelineEntry[]>;
export const COUNT = core.COUNT as [number, string][];
export const POP = core.POP as [number, number, string][];
export const GEPOP = core.GEPOP as [number, number][];
export const TYPES = core.TYPES as Record<EvType, [string, string]>;
export const PEAKS = core.PEAKS as [number, number, string, string][];
export const EVENTS = eventsJson as HistEvent[];
export const WAR = warsJson as unknown as Record<string, War>;
export const CITIES = citiesJson as City[];
export const LAKES = lakesJson as unknown as Record<string, Lake>;
export const PEOPLES = peoplesJson as unknown as Record<string, PeopleInfo>;
export const CINFO = cantonsJson as Record<CantonCode, CantonInfo>;

/** « de Berne », « d’Uri » */
export const deName = (code: CantonCode) => (/^[AEIOUÉ]/.test(NAMES[code]) ? 'd’' : 'de ') + NAMES[code];
