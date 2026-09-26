// Tüm locale dosyalarının en.js ile aynı anahtar yapısına ve {placeholder}'lara sahip olduğunu doğrular.
// Kullanım: node scripts/check-locales.mjs
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const dir = path.resolve('lib/locales');
const load = async (f) => {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  return Object.values(mod)[0];
};
const flat = (o, p = '') =>
  o && typeof o === 'object'
    ? Object.entries(o).flatMap(([k, v]) => flat(v, `${p}${p ? '.' : ''}${k}`))
    : [[p, o]];
const vars = (s) => JSON.stringify(typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort() : []);

const en = Object.fromEntries(flat(await load('en.js')));
let bad = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'en.js')) {
  const d = Object.fromEntries(flat(await load(f)));
  const missing = Object.keys(en).filter((k) => !(k in d));
  const extra = Object.keys(d).filter((k) => !(k in en));
  const ph = Object.keys(en).filter((k) => k in d && vars(en[k]) !== vars(d[k]));
  const empty = Object.keys(d).filter((k) => d[k] === '');
  if (missing.length || extra.length || ph.length || empty.length) {
    bad++;
    console.log(f, { missing, extra, placeholderMismatch: ph, empty });
  } else console.log(f, 'OK', Object.keys(d).length, 'keys');
}
console.log(bad ? 'FAIL' : 'ALL OK');
process.exit(bad ? 1 : 0);
