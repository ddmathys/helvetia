/* Progression du joueur : locale d'abord (localStorage), synchronisée dans Firestore (users/{uid} + leaderboard/{uid}). */
import { create } from 'zustand';
import {
  EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, linkWithCredential, linkWithPopup, onAuthStateChanged,
  signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { CantonCode } from '../lib/data';
import { BADGES, emptyProgress, helvetiaIndex, rankOf, type GameSummary, type Progress, type Stat } from '../quiz/scoring';
import { todayKey } from '../quiz/rng';

const LS = 'helvetia.progress.v1';

function loadLocal(): Progress {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch { /* stockage indisponible */ }
  return emptyProgress();
}
function saveLocal(p: Progress) {
  try { localStorage.setItem(LS, JSON.stringify(p)); } catch { /* stockage indisponible */ }
}

const maxStat = (a?: Stat, b?: Stat): Stat | undefined => (!a ? b : !b ? a : a.n >= b.n ? a : b);

/** Fusion de deux progressions (appareil et compte) : on garde le meilleur de chaque côté. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const base = a.xp >= b.xp ? a : b, other = base === a ? b : a;
  const cantons = { ...other.cantons } as Progress['cantons'];
  for (const [k, v] of Object.entries(base.cantons)) cantons[k as CantonCode] = maxStat(v, other.cantons[k as CantonCode]);
  const eras = { ...other.eras };
  for (const [k, v] of Object.entries(base.eras)) eras[k] = maxStat(v, other.eras[k])!;
  const best = { ...other.best };
  for (const [k, v] of Object.entries(base.best)) best[k] = Math.max(v, other.best[k] ?? 0);
  return {
    ...base,
    name: base.name || other.name,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    cantons, eras, best,
    badges: { ...other.badges, ...base.badges },
    daily: { ...other.daily, ...base.daily },
    missed: [...new Set([...base.missed, ...other.missed])].slice(-200),
    examBest: Math.max(a.examBest, b.examBest),
    chronoBest: Math.max(a.chronoBest, b.chronoBest),
  };
}

export interface AnswerRecord { id: string; ok: boolean; codes: CantonCode[]; era: number }
export interface GameResult { newBadges: string[]; rankUp: string | null; xpGained: number }

interface ProgressState {
  p: Progress;
  user: User | null;
  ready: boolean;
  syncError: string | null;
  init: () => void;
  setName: (n: string) => void;
  recordGame: (g: GameSummary, answers: AnswerRecord[], xp: number) => GameResult;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pw: string, create: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  submitDaily: (score: number, correct: number) => Promise<void>;
}

const defaultName = (uid: string) => `Voyageur ${uid.slice(0, 4).toUpperCase()}`;

async function pushRemote(user: User, p: Progress) {
  await setDoc(doc(db, 'users', user.uid), { ...p, updatedAt: Date.now() });
  await setDoc(doc(db, 'leaderboard', user.uid), {
    name: (p.name || defaultName(user.uid)).slice(0, 24),
    xp: Math.round(p.xp),
    rank: rankOf(p.xp).index,
    index: helvetiaIndex(p),
    badges: Object.keys(p.badges).length,
    games: p.games,
    updatedAt: serverTimestamp(),
  });
}

export const useProgress = create<ProgressState>((set, get) => {
  const sync = async () => {
    const { user, p } = get();
    if (!user) return;
    try { await pushRemote(user, p); set({ syncError: null }); }
    catch (e) { set({ syncError: (e as Error).message }); }
  };
  const adopt = async (user: User) => {
    set({ user });
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const local = get().p;
      const merged = snap.exists() ? mergeProgress(local, { ...emptyProgress(), ...(snap.data() as Progress) }) : local;
      if (!merged.name) merged.name = user.displayName?.split(' ')[0] || defaultName(user.uid);
      set({ p: merged, ready: true });
      saveLocal(merged);
      await sync();
    } catch (e) {
      set({ ready: true, syncError: (e as Error).message });
    }
  };

  return {
    p: loadLocal(),
    user: null,
    ready: false,
    syncError: null,

    init() {
      onAuthStateChanged(auth, u => {
        if (u) void adopt(u);
        else signInAnonymously(auth).catch(e => set({ ready: true, syncError: (e as Error).message }));
      });
    },

    setName(n) {
      const p = { ...get().p, name: n.trim().slice(0, 24) };
      set({ p }); saveLocal(p); void sync();
    },

    recordGame(g, answers, xp) {
      const before = get().p;
      const p: Progress = structuredClone(before);
      p.games += 1;
      p.xp += Math.round(xp);
      p.answered += answers.length;
      p.correct += answers.filter(a => a.ok).length;
      p.bestStreak = Math.max(p.bestStreak, g.bestStreak);
      p.best[g.mode] = Math.max(p.best[g.mode] ?? 0, g.mode === 'survival' ? g.correct : g.score);
      if (g.mode === 'exam') p.examBest = Math.max(p.examBest, Math.round((g.correct / g.total) * 100));
      if (g.mode === 'chrono') p.chronoBest = Math.max(p.chronoBest, g.score);
      if (g.mode === 'daily' && p.daily[todayKey()] === undefined) p.daily[todayKey()] = g.score; // seul le premier essai compte
      const missed = new Set(p.missed);
      for (const a of answers) {
        for (const c of a.codes.length <= 6 ? a.codes : []) {
          const s = p.cantons[c] ?? { ok: 0, n: 0 };
          p.cantons[c] = { ok: s.ok + (a.ok ? 1 : 0), n: s.n + 1 };
        }
        const e = p.eras[a.era] ?? { ok: 0, n: 0 };
        p.eras[a.era] = { ok: e.ok + (a.ok ? 1 : 0), n: e.n + 1 };
        if (a.ok) missed.delete(a.id); else missed.add(a.id);
      }
      p.missed = [...missed].slice(-200);
      const newBadges = BADGES.filter(b => !p.badges[b.id] && b.test(p, g)).map(b => b.id);
      for (const b of newBadges) p.badges[b] = Date.now();
      const r0 = rankOf(before.xp), r1 = rankOf(p.xp);
      p.updatedAt = Date.now();
      set({ p }); saveLocal(p); void sync();
      return { newBadges, rankUp: r1.index > r0.index ? r1.title : null, xpGained: Math.round(xp) };
    },

    async signInGoogle() {
      const provider = new GoogleAuthProvider();
      const cur = auth.currentUser;
      if (cur?.isAnonymous) {
        try {
          const r = await linkWithPopup(cur, provider);
          await adopt(r.user);
          return;
        } catch (e) {
          const cred = GoogleAuthProvider.credentialFromError(e as never);
          if ((e as { code?: string }).code !== 'auth/credential-already-in-use' || !cred) throw e;
          await signInWithPopup(auth, provider); // compte existant : la progression locale est fusionnée dans adopt()
          return;
        }
      }
      await signInWithPopup(auth, provider);
    },

    async signInEmail(email, pw, createAccount) {
      const cur = auth.currentUser;
      if (createAccount) {
        if (cur?.isAnonymous) { const r = await linkWithCredential(cur, EmailAuthProvider.credential(email, pw)); await adopt(r.user); }
        else await createUserWithEmailAndPassword(auth, email, pw);
      } else await signInWithEmailAndPassword(auth, email, pw);
    },

    async signOut() {
      const fresh = emptyProgress();
      saveLocal(fresh);
      set({ p: fresh, user: null });
      await fbSignOut(auth); // onAuthStateChanged relance une session invitée
    },

    async submitDaily(score, correct) {
      const { user, p } = get();
      if (!user) return;
      const ref = doc(db, 'daily', todayKey(), 'scores', user.uid);
      const snap = await getDoc(ref).catch(() => null);
      if (snap?.exists()) return; // un seul score par jour
      await setDoc(ref, { name: (p.name || defaultName(user.uid)).slice(0, 24), score: Math.round(score), correct, at: serverTimestamp() });
    },
  };
});
