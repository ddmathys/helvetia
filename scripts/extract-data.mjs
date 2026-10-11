// Extrait les données du prototype helvetia.html vers src/data/*.json (source de vérité = spec §8)
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const [,, src, outDir] = process.argv;
const html = fs.readFileSync(src, 'utf8');
const start = html.indexOf('const TOPO=');
const end = html.indexOf('/* ================= CARTE');
const code = html.slice(start, end) + `;globalThis.__out={TOPO,CODES,NAMES,BP,PC,ERAS,PRE,ST,TL,COUNT,POP,GEPOP,LAKES,CITIES,PEAKS,TYPES,EV,INFO,WAR,CINFO};`;
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const o = ctx.__out;
const w = (n, d) => { fs.writeFileSync(path.join(outDir, n), JSON.stringify(d)); console.log(n, (JSON.stringify(d).length/1024).toFixed(1)+' KB'); };
w('switzerland.topo.json', o.TOPO);
w('core.json', { CODES:o.CODES, NAMES:o.NAMES, BP:o.BP, PC:o.PC, ERAS:o.ERAS, PRE:o.PRE, ST:o.ST, TL:o.TL, COUNT:o.COUNT, POP:o.POP, GEPOP:o.GEPOP, TYPES:o.TYPES, PEAKS:o.PEAKS });
w('events.json', o.EV); w('wars.json', o.WAR); w('cities.json', o.CITIES); w('lakes.json', o.LAKES);
w('peoples.json', o.INFO); w('cantons.json', o.CINFO);
console.log('events', o.EV.length, 'wars', Object.keys(o.WAR).length, 'cities', o.CITIES.length, 'lakes', Object.keys(o.LAKES).length, 'peoples', Object.keys(o.INFO).length, 'topo objects', Object.keys(o.TOPO.objects));
