import { useState } from 'react';
import { ERAS, NAMES } from '../lib/data';
import { SwissMap } from '../components/SwissMap';
import { RingIndex } from '../components/RingIndex';
import { useProgress } from '../state/progress';
import { useQuiz } from '../state/quiz';
import { BADGES, MASTERY, RANKS, eraIndex, helvetiaIndex, masteryHint, masteryLevel, rankOf } from '../quiz/scoring';
import { MasteryLegend } from '../quiz/QuizHub';
import type { CantonCode } from '../lib/data';

function authMessage(e: unknown): string {
  const code = (e as { code?: string }).code ?? '';
  if (code.includes('operation-not-allowed')) return 'Ce mode de connexion n’est pas encore activé dans Firebase.';
  if (code.includes('popup-closed')) return 'Fenêtre fermée avant la fin.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'E-mail ou mot de passe incorrect.';
  if (code.includes('email-already-in-use')) return 'Cet e-mail a déjà un compte : connecte-toi plutôt.';
  if (code.includes('weak-password')) return 'Mot de passe trop court (6 caractères minimum).';
  return (e as Error).message;
}

function Account() {
  const { user, signInGoogle, signInEmail, signOut } = useProgress();
  const [mode, setMode] = useState<'none' | 'login' | 'create'>('none');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await f(); setMode('none'); } catch (e) { setErr(authMessage(e)); } finally { setBusy(false); }
  };
  if (user && !user.isAnonymous) {
    return (
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Connecté : <b style={{ color: 'var(--ink)' }}>{user.email ?? user.displayName}</b> · progression sauvegardée dans le cloud ☁️</span>
        <button className="ghost" onClick={() => void signOut()}>Se déconnecter</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="muted" style={{ margin: 0 }}>Tu joues en invité : ta progression est déjà sur le serveur, mais liée à cet appareil. Crée un compte pour la retrouver partout.</p>
      <div className="row-wrap">
        <button className="primary" disabled={busy} onClick={() => run(signInGoogle)}>Continuer avec Google</button>
        <button className="ghost" onClick={() => setMode(mode === 'create' ? 'none' : 'create')}>Créer un compte e-mail</button>
        <button className="ghost" onClick={() => setMode(mode === 'login' ? 'none' : 'login')}>J’ai déjà un compte</button>
      </div>
      {mode !== 'none' && (
        <form className="row-wrap" onSubmit={e => { e.preventDefault(); void run(() => signInEmail(email, pw, mode === 'create')); }}>
          <label className="field" style={{ flex: '1 1 200px' }}><span className="muted">E-mail</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
          <label className="field" style={{ flex: '1 1 160px' }}><span className="muted">Mot de passe</span><input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} /></label>
          <button className="primary" disabled={busy} style={{ alignSelf: 'flex-end' }}>{mode === 'create' ? 'Créer' : 'Se connecter'}</button>
        </form>
      )}
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function Profile() {
  const p = useProgress(s => s.p);
  const syncError = useProgress(s => s.syncError);
  const setName = useProgress(s => s.setName);
  const [name, setNameDraft] = useState<string | null>(null);
  const [focus, setFocus] = useState<CantonCode | null>(null);
  const r = rankOf(p.xp);
  const start = useQuiz(s => s.start);

  return (
    <div className="page">
      <div className="page-in">
        <div>
          <h3>Profil</h3>
          <h1>{r.icon} <em>{p.name || 'Voyageur'}</em></h1>
          <p className="lead">{r.title} · {p.xp.toLocaleString('fr-CH')} XP · {Object.keys(p.badges).length}/{BADGES.length} badges</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3>Pseudo affiché au classement</h3>
          <form className="row-wrap" onSubmit={e => { e.preventDefault(); if (name?.trim()) { setName(name); setNameDraft(null); } }}>
            <input className="field" style={{ flex: '1 1 200px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 12px', color: 'var(--ink)', font: 'inherit' }}
              maxLength={24} value={name ?? p.name} onChange={e => setNameDraft(e.target.value)} aria-label="Pseudo" />
            <button className="ghost" disabled={name === null}>Enregistrer</button>
          </form>
          <Account />
          {syncError && <span className="err">Synchronisation en attente : {syncError}</span>}
        </div>

        <div className="split">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <h3>Ma carte de maîtrise</h3>
              <RingIndex value={helvetiaIndex(p)} label="CANTONS" size={84} />
            </div>
            <SwissMap className="qmap" labels={c => c} hoverLabel fill={c => MASTERY[masteryLevel(p.cantons[c])].color} onCanton={setFocus} />
            <MasteryLegend />
            {focus && (
              <div className="cta" role="group">
                <span className="big">{['🌫️', '🎒', '🧭', '⭐', '🏅'][masteryLevel(p.cantons[focus])]}</span>
                <span style={{ flex: 1 }}>
                  <b>{NAMES[focus]} · {MASTERY[masteryLevel(p.cantons[focus])].title}</b>
                  <small>{p.cantons[focus]?.ok ?? 0} bonnes réponses sur {p.cantons[focus]?.n ?? 0} · {masteryHint(p.cantons[focus])}</small>
                </span>
                <button className="primary" onClick={() => start({ mode: 'canton', code: focus })}>Jouer</button>
              </div>
            )}
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <h3>Maîtrise des époques</h3>
              <RingIndex value={eraIndex(p)} label="ÉPOQUES" size={84} />
            </div>
            {ERAS.map((e, i) => {
              const s = p.eras[i], lvl = masteryLevel(s);
              return (
                <div key={i}>
                  <div className="row-wrap" style={{ justifyContent: 'space-between', fontSize: '.86rem', fontWeight: 700 }}>
                    <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: e.color, marginRight: 8 }} />{e.name}</span>
                    <span style={{ color: MASTERY[lvl].color }}>{MASTERY[lvl].title}</span>
                  </div>
                  <div className="bar"><i style={{ width: `${(lvl / 4) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3>Badges</h3>
          <div className="badges">
            {BADGES.map(b => (
              <div key={b.id} className={`badge ${p.badges[b.id] ? 'on' : ''}`}>
                <span className="bi">{b.icon}</span><b>{b.title}</b><small>{b.desc}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3>Les rangs</h3>
          <div className="evlist">
            {RANKS.map((k, i) => (
              <div key={k.title} className={`btn ${i > r.index ? 'future' : ''}`} style={{ cursor: 'default', borderColor: i === r.index ? 'var(--gold)' : undefined }}>
                <b>{k.icon}</b><span style={{ flex: 1 }}>{k.title}</span><span className="muted">{k.xp.toLocaleString('fr-CH')} XP</span>
              </div>
            ))}
          </div>
        </div>

        <p className="src">Helvetia · textes d’après le <a href="https://hls-dhs-dss.ch/fr/" target="_blank" rel="noopener">Dictionnaire historique de la Suisse</a> (CC BY-SA 4.0) et Wikipédia (CC BY-SA). Population : OFS. Fond de carte : OFS GEOSTAT (usage non commercial). Portraits : illustrations d’après les découvertes archéologiques.</p>
      </div>
    </div>
  );
}
