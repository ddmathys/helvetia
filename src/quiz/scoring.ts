import { ALL_CODES, ERAS, type CantonCode } from '../lib/data';

export interface Stat { ok: number; n: number }

export interface Progress {
  name: string;
  xp: number;
  games: number;
  answered: number;
  correct: number;
  bestStreak: number;
  cantons: Partial<Record<CantonCode, Stat>>;
  eras: Record<string, Stat>;
  missed: string[];
  badges: Record<string, number>;
  best: Record<string, number>;
  daily: Record<string, number>;
  examBest: number;
  chronoBest: number;
  updatedAt: number;
}

export const emptyProgress = (): Progress => ({
  name: '', xp: 0, games: 0, answered: 0, correct: 0, bestStreak: 0, cantons: {}, eras: {}, missed: [], badges: {}, best: {}, daily: {},
  examBest: 0, chronoBest: 0, updatedAt: 0,
});

/* ===== Rangs (XP cumulée) ===== */
export const RANKS = [
  { xp: 0, title: 'Touriste', icon: '🎒' },
  { xp: 300, title: 'Randonneur', icon: '🥾' },
  { xp: 1000, title: 'Résident', icon: '🏡' },
  { xp: 2500, title: 'Habitant', icon: '🧀' },
  { xp: 5000, title: 'Bourgeois', icon: '🏛️' },
  { xp: 9000, title: 'Conseiller communal', icon: '📜' },
  { xp: 15000, title: 'Député au Grand Conseil', icon: '⚖️' },
  { xp: 24000, title: 'Landammann', icon: '🗡️' },
  { xp: 36000, title: 'Conseiller fédéral', icon: '🇨🇭' },
  { xp: 52000, title: 'Helvetia', icon: '👑' },
];

export function rankOf(xp: number) {
  let i = 0;
  while (i < RANKS.length - 1 && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  return { index: i, ...cur, next, frac: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

/* ===== Maîtrise d'un canton ou d'une époque (0–4) ===== */
export const MASTERY = [
  { title: 'Inconnu', color: '#2a3a4d' },
  { title: 'Visiteur', color: '#8a6a3a' },
  { title: 'Connaisseur', color: '#a9b4c2' },
  { title: 'Expert', color: '#f2c46d' },
  { title: 'Citoyen d’honneur', color: '#e2453c' },
];

export function masteryLevel(s?: Stat): number {
  if (!s) return 0;
  const acc = s.n ? s.ok / s.n : 0;
  if (s.ok >= 25 && acc >= 0.85) return 4;
  if (s.ok >= 15 && acc >= 0.75) return 3;
  if (s.ok >= 8 && acc >= 0.6) return 2;
  if (s.ok >= 3) return 1;
  return 0;
}

/** Prochaine marche à franchir, pour guider le joueur. */
export function masteryHint(s?: Stat): string {
  const lvl = masteryLevel(s), ok = s?.ok ?? 0, acc = s && s.n ? Math.round((s.ok / s.n) * 100) : 0;
  const goals = [[3, 0], [8, 60], [15, 75], [25, 85]];
  if (lvl >= 4) return 'Niveau maximal atteint';
  const [g, a] = goals[lvl];
  const parts = [];
  if (ok < g) parts.push(`${g - ok} bonne${g - ok > 1 ? 's' : ''} réponse${g - ok > 1 ? 's' : ''}`);
  if (acc < a) parts.push(`${a} % de réussite (actuellement ${acc} %)`);
  return `Pour « ${MASTERY[lvl + 1].title} » : ${parts.join(' et ') || 'encore une partie'}`;
}

/** Indice Helvetia : part de la maîtrise maximale sur les 26 cantons (0–100). */
export function helvetiaIndex(p: Progress): number {
  const sum = ALL_CODES.reduce((a, c) => a + masteryLevel(p.cantons[c]), 0);
  return Math.round((sum / (ALL_CODES.length * 4)) * 100);
}

export function eraIndex(p: Progress): number {
  const sum = ERAS.reduce((a, _, i) => a + masteryLevel(p.eras[i]), 0);
  return Math.round((sum / (ERAS.length * 4)) * 100);
}

/* ===== Points ===== */
export function pointsFor(diff: number, timeFrac: number | null, streak: number): number {
  const base = 100 * diff;
  const speed = timeFrac === null ? 0 : Math.round(base * 0.5 * Math.max(0, timeFrac));
  const mult = 1 + 0.1 * Math.min(streak, 10);
  return Math.round((base + speed) * mult);
}

/* ===== Badges ===== */
export interface GameSummary { mode: string; correct: number; total: number; bestStreak: number; score: number; chronoBestRound?: number; chronoMinKm?: number }

export const BADGES: { id: string; icon: string; title: string; desc: string; test: (p: Progress, g?: GameSummary) => boolean }[] = [
  { id: 'first', icon: '👣', title: 'Premiers pas', desc: 'Terminer une première partie', test: p => p.games >= 1 },
  { id: 'perfect', icon: '💯', title: 'Sans faute', desc: '10 sur 10 dans une partie', test: (_, g) => !!g && g.total >= 10 && g.correct === g.total },
  { id: 'streak10', icon: '🔥', title: 'En feu', desc: 'Série de 10 bonnes réponses', test: p => p.bestStreak >= 10 },
  { id: 'streak25', icon: '🏔️', title: 'Inébranlable', desc: 'Série de 25 bonnes réponses', test: p => p.bestStreak >= 25 },
  { id: 'tell', icon: '🎯', title: 'Guillaume Tell', desc: 'Chrono-Géo : placer un événement à moins de 10 km', test: (_, g) => (g?.chronoMinKm ?? 999) < 10 },
  { id: 'chrono', icon: '⏳', title: 'Maître du temps', desc: 'Chrono-Géo : une manche à 950 points ou plus', test: (_, g) => (g?.chronoBestRound ?? 0) >= 950 },
  { id: 'tour', icon: '🗺️', title: 'Tour de Suisse', desc: 'Les 26 cantons au moins « Visiteur »', test: p => ALL_CODES.every(c => masteryLevel(p.cantons[c]) >= 1) },
  { id: 'all26', icon: '🇨🇭', title: 'Les Vingt-Six', desc: 'Les 26 cantons au moins « Connaisseur »', test: p => ALL_CODES.every(c => masteryLevel(p.cantons[c]) >= 2) },
  { id: 'honor', icon: '🏅', title: 'Citoyen d’honneur', desc: 'Un canton au niveau maximal', test: p => ALL_CODES.some(c => masteryLevel(p.cantons[c]) >= 4) },
  { id: 'grutli', icon: '🤝', title: 'Serment du Grütli', desc: 'Uri, Schwytz, Obwald et Nidwald « Connaisseur »', test: p => (['UR', 'SZ', 'OW', 'NW'] as CantonCode[]).every(c => masteryLevel(p.cantons[c]) >= 2) },
  { id: 'romand', icon: '🍷', title: 'Romand de cœur', desc: 'Les 6 cantons romands « Connaisseur »', test: p => (['GE', 'VD', 'NE', 'JU', 'FR', 'VS'] as CantonCode[]).every(c => masteryLevel(p.cantons[c]) >= 2) },
  { id: 'time', icon: '🕰️', title: 'Voyageur du temps', desc: 'Les 9 époques au moins « Visiteur »', test: p => ERAS.every((_, i) => masteryLevel(p.eras[i]) >= 1) },
  { id: 'exam', icon: '📘', title: 'Prêt pour l’examen', desc: 'Réussir l’examen blanc (70 % ou plus)', test: p => p.examBest >= 70 },
  { id: 'gothard', icon: '⛰️', title: 'Solide comme le Gothard', desc: '20 bonnes réponses en mode Survie', test: p => (p.best.survival ?? 0) >= 20 },
  { id: 'daily3', icon: '📅', title: 'Fidèle au poste', desc: 'Jouer 3 défis du jour', test: p => Object.keys(p.daily).length >= 3 },
];
