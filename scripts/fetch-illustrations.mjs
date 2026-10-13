/* Illustrations des fiches, tirées de Wikipédia / Wikimedia Commons (licences libres, auteur et licence conservés).
   node scripts/fetch-illustrations.mjs resolve  → scripts/wiki-map.json (fiche → article), à relire à la main
   node scripts/fetch-illustrations.mjs fetch    → src/data/illustrations.json + public/img/f/*.webp */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const UA = { 'User-Agent': 'HelvetiaBuild/1.0 (https://helvetia-be8e9.web.app; educational app; david.mathys24@gmail.com)' };
const root = new URL('../', import.meta.url);
const read = async p => JSON.parse(await readFile(new URL(p, root), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r;
    if (r.status === 404) return null;
    await sleep(5000 * (i + 1)); // limite de débit de Wikimedia
  }
  throw new Error(`HTTP échec ${url}`);
}
const json = async url => (await get(url))?.json();

async function fiches() {
  const events = await read('src/data/events.json');
  const cities = await read('src/data/cities.json');
  const trads = await read('src/data/traditions.json');
  return [
    ...events.map(e => ({ id: `ev${e.id}`, q: e.title, hint: e.text })),
    ...cities.map(c => ({ id: `ci${c.id}`, q: c.names.filter(n => n[1]).at(-1)[1] + ' ville suisse' })),
    ...trads.map(t => ({ id: `tr-${t.id}`, wiki: t.wiki, q: t.title })),
  ];
}

async function resolve() {
  const mapUrl = new URL('scripts/wiki-map.json', root);
  let map = {};
  try { map = JSON.parse(await readFile(mapUrl, 'utf8')); } catch { /* premier passage */ }
  for (const f of await fiches()) {
    if (map[f.id] !== undefined) continue;
    if (f.wiki) { map[f.id] = f.wiki; continue; }
    const s = await json(`https://fr.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(f.q)}`);
    map[f.id] = s?.query?.search?.[0]?.title ?? null;
    console.log(f.id.padEnd(6), '|', f.q, '→', map[f.id]);
    await sleep(120);
  }
  await writeFile(mapUrl, JSON.stringify(map, null, 1));
}

/* Images à écarter : cartes, blasons, drapeaux, logos (souvent des SVG). */
const BAD = /(\.svg$|\.tif|karte|map|carte|locator|location|wappen|coat[_ ]of|blason|armoiries|flag|drapeau|logo|signature|icon|commons-logo|plan_)/i;

/* « de:Titre » = article allemand : on n'en garde que l'image (pas d'extrait, l'app est en français). */
async function pageImage(ref) {
  const [lang, title] = /^[a-z]{2}:/.test(ref) ? [ref.slice(0, 2), ref.slice(3)] : ['fr', ref];
  const sum = await json(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  if (!sum) return null;
  // l'URL porte des paramètres de suivi (?utm_…) : on ne garde que le nom du fichier
  // grandes images : l'URL pointe vers une miniature (…/thumb/a/ab/Nom.jpg/3840px-Nom.jpg)
  const src = sum.originalimage?.source?.split('?')[0];
  const m = src?.match(/\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
  const file = m ? decodeURIComponent(m[1]) : null;
  // pas de repli sur les autres images de l'article : l'API les liste par ordre alphabétique, donc au hasard
  return { sum, file: file && !BAD.test(file) ? file : null, lang };
}

const strip = s => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function fetchAll() {
  const map = await read('scripts/wiki-map.json');
  const outUrl = new URL('src/data/illustrations.json', root);
  let out = {};
  try { out = JSON.parse(await readFile(outUrl, 'utf8')); } catch { /* premier passage */ }
  const forced = await read('scripts/wiki-images.json').catch(() => ({})); // fiche → fichier Commons imposé (null = pas d'image : carte, image hors sujet)
  await mkdir(new URL('public/img/f/', root), { recursive: true });
  for (const [id, title] of Object.entries(map)) {
    if (!title) { delete out[id]; continue; }
    const prev = out[id];
    const want = id in forced ? forced[id] : undefined;
    if (prev && prev.ref === title && (want === undefined || (want ?? undefined) === prev.file)) continue;
    const r = await pageImage(title);
    if (!r) { console.log('✗ page introuvable', id, title); continue; }
    const file = want === undefined ? r.file : want;
    const entry = { ref: title, page: r.sum.titles.canonical.replace(/_/g, ' '), url: r.sum.content_urls.desktop.page, ...(r.lang === 'fr' ? { extract: r.sum.extract } : {}) };
    if (file) {
      const ii = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=960&titles=${encodeURIComponent('File:' + file)}`);
      const info = Object.values(ii?.query?.pages ?? {})[0]?.imageinfo?.[0];
      if (info) {
        const m = info.extmetadata ?? {};
        const buf = Buffer.from(await (await get(info.thumburl ?? info.url)).arrayBuffer());
        const base = fileURLToPath(new URL(`public/img/f/${id}`, root));
        const img = sharp(buf).rotate();
        const meta = await img.metadata();
        await img.clone().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 78 }).toFile(base + '.webp');
        await img.clone().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 74 }).toFile(base + '-s.webp');
        Object.assign(entry, {
          file,
          ratio: +(meta.width / meta.height).toFixed(3),
          artist: strip(m.Artist?.value).slice(0, 120) || 'Auteur inconnu',
          license: strip(m.LicenseShortName?.value) || 'Licence libre',
          source: info.descriptionurl,
        });
      }
    }
    out[id] = entry;
    console.log(entry.file ? '✓' : '·', id.padEnd(16), title, '|', entry.file ?? 'sans image');
    await writeFile(outUrl, JSON.stringify(out));
    await sleep(1200);
  }
  await writeFile(outUrl, JSON.stringify(out));
}

const cmd = process.argv[2];
if (cmd === 'resolve') await resolve();
else if (cmd === 'fetch') await fetchAll();
else console.log('usage : resolve | fetch');
