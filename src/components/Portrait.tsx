import { useId } from 'react';
import type { PortraitParams } from '../lib/data';

/* Buste vectoriel paramétrique (spec §5.5), dessin repris du prototype. */
function portraitSvg(f: PortraitParams, bg: string, uid: string): string {
  const g: string[] = [];
  const sk = f.skin, hc = f.hairC, pc = `pc${uid}`, chk = `chk${uid}`;
  g.push(`<defs><clipPath id="${pc}"><circle cx="100" cy="110" r="100"/></clipPath><pattern id="${chk}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${f.garment}"/><rect width="12" height="4" fill="rgba(0,0,0,.25)"/><rect width="4" height="12" fill="rgba(255,255,255,.12)"/></pattern></defs>`);
  g.push(`<g clip-path="url(#${pc})"><rect width="200" height="220" fill="${bg}"/><path d="M0 150 L40 112 L64 130 L98 92 L130 124 L156 104 L200 140 L200 220 L0 220Z" fill="rgba(255,255,255,.08)"/><path d="M98 92 L108 102 L102 104 L98 98 L92 104 L88 101Z" fill="rgba(255,255,255,.18)"/>`);
  if (f.hair === 'long' || f.hair === 'braid') g.push(`<path d="M64 98 C60 150 70 170 70 176 L130 176 C130 170 140 150 136 98Z" fill="${hc}"/>`);
  g.push(`<path d="M24 220 C30 172 62 152 100 150 C138 152 170 172 176 220Z" fill="${f.pattern ? `url(#${chk})` : f.garment}"/>`);
  if (f.cloak) g.push(`<path d="M22 220 C26 178 52 158 80 152 L70 220Z" fill="${f.cloak}"/><path d="M178 220 C174 178 148 158 120 152 L130 220Z" fill="${f.cloak}"/>`);
  if (f.fur) g.push(`<path d="M40 176 C60 160 80 156 100 156 C120 156 140 160 160 176 L156 184 C138 170 120 166 100 166 C80 166 62 170 44 184Z" fill="${f.cloak}" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-dasharray="2 3"/>`);
  if (f.fibula) g.push(`<circle cx="78" cy="168" r="6" fill="#e0b34a"/><circle cx="78" cy="168" r="2.5" fill="#8a6a2a"/>`);
  if (f.buckle) g.push(`<rect x="86" y="198" width="28" height="18" rx="4" fill="#c9c9c9"/><path d="M92 204h16M92 210h16" stroke="#8a6a2a" stroke-width="2"/>`);
  if (f.cross) g.push(`<path d="M100 170v20M93 177h14" stroke="#e0b34a" stroke-width="3.5" stroke-linecap="round"/>`);
  if (f.necklace) g.push(`<path d="M86 152 C92 162 108 162 114 152" fill="none" stroke="#d9c39a" stroke-width="3" stroke-dasharray="3 3"/>`);
  g.push(`<rect x="88" y="124" width="24" height="30" rx="8" fill="${sk}"/><path d="M88 140 C96 146 104 146 112 140 L112 150 C104 156 96 156 88 150Z" fill="rgba(0,0,0,.12)"/>`);
  if (f.torc) g.push(`<path d="M84 148 C90 160 110 160 116 148" fill="none" stroke="${f.torc}" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="148" r="4" fill="${f.torc}"/><circle cx="116" cy="148" r="4" fill="${f.torc}"/>`);
  g.push(`<ellipse cx="70" cy="104" rx="5" ry="8" fill="${sk}"/><ellipse cx="130" cy="104" rx="5" ry="8" fill="${sk}"/><ellipse cx="100" cy="100" rx="30" ry="36" fill="${sk}"/>`);
  g.push(`<ellipse cx="88" cy="114" rx="6" ry="3.5" fill="rgba(200,90,80,${f.female ? 0.28 : 0.15})"/><ellipse cx="112" cy="114" rx="6" ry="3.5" fill="rgba(200,90,80,${f.female ? 0.28 : 0.15})"/>`);
  g.push(`<circle cx="89" cy="101" r="2.8" fill="#24180f"/><circle cx="111" cy="101" r="2.8" fill="#24180f"/><path d="M83 93 Q89 90 95 93M105 93 Q111 90 117 93" stroke="${hc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  g.push(`<path d="M100 104 L97 114 L102 114" stroke="rgba(0,0,0,.25)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M94 122 Q100 125 106 122" stroke="#8a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  if (f.beard === 'full' || f.beard === 'long') {
    const L = f.beard === 'long';
    g.push(`<path d="M71 104 C70 ${L ? 158 : 138} 92 ${L ? 168 : 148} 100 ${L ? 170 : 148} C108 ${L ? 168 : 148} 130 ${L ? 158 : 138} 129 104 C124 118 116 126 100 126 C84 126 76 118 71 104Z" fill="${hc}"/><path d="M92 121 Q100 118 108 121" stroke="#8a4a3a" stroke-width="2" fill="none"/>`);
  }
  if (f.beard === 'mustache' || f.beard === 'full' || f.beard === 'long') g.push(`<path d="M86 120 C92 114 108 114 114 120 C116 126 118 132 116 136 C112 128 106 122 100 122 C94 122 88 128 84 136 C82 132 84 126 86 120Z" fill="${hc}"/>`);
  if (f.female) g.push(`<circle cx="70" cy="114" r="2.6" fill="#e0b34a"/><circle cx="130" cy="114" r="2.6" fill="#e0b34a"/>`);
  if (f.hair === 'long' || f.hair === 'braid') g.push(`<path d="M68 104 C62 62 138 62 132 104 C124 84 112 78 100 78 C88 78 76 84 68 104Z" fill="${hc}"/>`);
  if (f.hair === 'braid') g.push(`<path d="M132 100 C142 130 140 160 136 182" stroke="${hc}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="7 2"/>`);
  if (f.hair === 'short') g.push(`<path d="M69 100 C66 64 134 64 131 100 C126 84 114 76 100 76 C86 76 74 84 69 100Z" fill="${hc}"/>`);
  if (f.hair === 'bun') g.push(`<circle cx="100" cy="64" r="13" fill="${hc}"/><path d="M68 102 C64 64 136 64 132 102 C124 82 112 76 100 76 C88 76 76 82 68 102Z" fill="${hc}"/>`);
  if (f.hair === 'tonsure') g.push(`<path d="M69 100 C66 64 134 64 131 100 C126 84 114 76 100 76 C86 76 74 84 69 100Z" fill="${hc}"/><ellipse cx="100" cy="70" rx="20" ry="8" fill="${sk}"/>`);
  const hcC = f.hatC || '#888';
  if (f.hat === 'hood') g.push(`<path d="M60 112 C54 54 146 54 140 112 C138 92 126 74 100 74 C74 74 62 92 60 112Z" fill="${hcC}"/><path d="M60 112 C58 140 66 150 76 156 L70 158 C56 150 52 134 60 112Z M140 112 C142 140 134 150 124 156 L130 158 C144 150 148 134 140 112Z" fill="${hcC}"/>`);
  if (f.hat === 'roman') g.push(`<path d="M66 96 C64 52 136 52 134 96 L128 96 C124 76 112 70 100 70 C88 70 76 76 72 96Z" fill="${hcC}"/><rect x="64" y="92" width="72" height="7" rx="3" fill="${hcC}"/><path d="M66 98 L64 124 L74 122 L74 98Z M134 98 L136 124 L126 122 L126 98Z" fill="${hcC}"/><path d="M78 56 C88 36 112 36 122 56" stroke="#b8322e" stroke-width="9" fill="none" stroke-linecap="round"/>`);
  if (f.hat === 'spangen') g.push(`<path d="M66 98 C64 54 136 54 134 98Z" fill="${hcC}"/><path d="M100 58v40M70 80 C86 74 114 74 130 80" stroke="#c9a04a" stroke-width="4" fill="none"/><rect x="64" y="94" width="72" height="7" rx="3" fill="#c9a04a"/>`);
  if (f.hat === 'mitre') g.push(`<path d="M74 82 L76 40 L100 26 L124 40 L126 82 C112 76 88 76 74 82Z" fill="${hcC}"/><path d="M100 28v52M77 58 C90 54 110 54 123 58" stroke="#e0b34a" stroke-width="4" fill="none"/>`);
  if (f.hat === 'coronet') g.push(`<path d="M70 82 L72 64 L80 74 L90 60 L100 72 L110 60 L120 74 L128 64 L130 82 C114 76 86 76 70 82Z" fill="${hcC}"/><circle cx="100" cy="76" r="3" fill="#b8322e"/>`);
  if (f.hat === 'headband') g.push(`<path d="M68 84 C86 76 114 76 132 84" stroke="${hcC}" stroke-width="6" fill="none"/>`);
  g.push(`</g><circle cx="100" cy="110" r="99" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"/>`);
  return `<svg viewBox="0 0 200 220" role="img" aria-label="Portrait illustré">${g.join('')}</svg>`;
}

export function Portrait({ fig, bg, size }: { fig: PortraitParams; bg: string; size?: number }) {
  const uid = useId().replace(/:/g, '');
  return <span className="portrait-svg" style={size ? { width: size } : undefined} dangerouslySetInnerHTML={{ __html: portraitSvg(fig, bg, uid) }} />;
}
