// ASO store-listing character-count check for the 7 new locales (es, de, pt, fr, ru, hi, id).
// Parses each docs/store-listing/01-listing-<lang>.md file and reports the length (JS string
// length = UTF-16 code units, same as what Play Console / App Store Connect count) of every
// field that has a hard limit, flagging anything over.
//
// Run: node scripts/check-store-listing-lengths.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'docs', 'store-listing');

const LANGS = ['es', 'de', 'pt', 'fr', 'ru', 'hi', 'id'];

const LIMITS = {
  'Play title': 30,
  'Play short description': 80,
  'Play full description': 4000,
  'iOS name': 30,
  'iOS subtitle': 30,
  'iOS promo text': 170,
  'iOS keywords': 100,
};

function extractBacktick(text, labelPattern) {
  const re = new RegExp(labelPattern + '[^`]*`([^`]*)`', 'u');
  const m = text.match(re);
  return m ? m[1] : null;
}

function extractShortDescBlock(text) {
  // Second-line backtick value right after the "short description" label line.
  const re = /[Kk]ısa|[Dd]escripci[oó]n corta|[Kk]urzbeschreibung|[Dd]escri[cç][aã]o curta|[Dd]escription courte|[Кк]ороткое описание|[Dd]escripsi singkat|[शॉ]/u;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/short description|kısa açıklama|descripci[oó]n corta|kurzbeschreibung|descri[cç][aã]o curta|description courte|короткое описание|deskripsi singkat|शॉर्ट डिस्क्रिप्शन/iu.test(lines[i])) {
      // value is on next non-empty line, inside backticks
      for (let j = i + 1; j < lines.length; j++) {
        const m = lines[j].match(/`([^`]*)`/u);
        if (m) return m[1];
        if (lines[j].trim() !== '') break;
      }
    }
  }
  return null;
}

function extractFullDescription(text) {
  const start = text.indexOf('```');
  if (start === -1) return null;
  const end = text.indexOf('```', start + 3);
  if (end === -1) return null;
  return text.slice(start + 3, end).replace(/^\n/, '').replace(/\n$/, '');
}

function extractField(text, labelRegexes) {
  for (const re of labelRegexes) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

let anyOver = false;
const rows = [];

for (const lang of LANGS) {
  const file = path.join(dir, `01-listing-${lang}.md`);
  const text = readFileSync(file, 'utf8');

  const playTitle = extractField(text, [/\*\*(?:Title|Başlık|T[ií]tulo|Titel|Titre|Judul|[Нн]азвание|टाइटल)[^`]*`([^`]*)`/u]);
  const shortDesc = extractShortDescBlock(text);
  const fullDesc = extractFullDescription(text);

  const iosSection = text.slice(text.indexOf('App Store'));
  const iosName = extractField(iosSection, [/\*\*(?:Name|Ad|Nombre|Nome|Nom|Nama|[Ии]мя|नाम)[^`]*`([^`]*)`/u]);
  const iosSubtitle = extractField(iosSection, [/\*\*(?:Subtitle|Alt başlık|Subt[ií]tulo|Untertitel|[Пп]одзаголовок|सबटाइटल|Sous-titre)[^`]*`([^`]*)`/u]);
  const iosPromo = extractField(iosSection, [/\*\*(?:Promo text|Tan[ıi]t[ıi]m metni|Texto promo[^`*]*|Texte promo|Promo-Text|Teks promo|[Пп]ромо-текст|प्रोमो टेक्स्ट)[^`]*`([^`]*)`/u]);
  const iosKeywords = extractField(iosSection, [/\*\*(?:Keywords?|Anahtar kelimeler|Mots-cl[ée]s|[Кк]люч[её]вые слова|कीवर्ड्स)[^`]*`([^`]*)`\s*\n`([^`]*)`/u, /\*\*(?:Keywords?|Anahtar kelimeler|Mots-cl[ée]s|[Кк]люч[её]вые слова|कीवर्ड्स)[^`]*`([^`]*)`/u]);

  const fields = [
    ['Play title', playTitle, LIMITS['Play title']],
    ['Play short description', shortDesc, LIMITS['Play short description']],
    ['Play full description', fullDesc, LIMITS['Play full description']],
    ['iOS name', iosName, LIMITS['iOS name']],
    ['iOS subtitle', iosSubtitle, LIMITS['iOS subtitle']],
    ['iOS promo text', iosPromo, LIMITS['iOS promo text']],
    ['iOS keywords', iosKeywords, LIMITS['iOS keywords']],
  ];

  for (const [name, value, limit] of fields) {
    if (value === null) {
      rows.push({ lang, field: name, length: 'MISSING', limit, ok: false });
      anyOver = true;
      continue;
    }
    const len = value.length;
    const ok = len <= limit;
    if (!ok) anyOver = true;
    rows.push({ lang, field: name, length: len, limit, ok });
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('Lang', 6) + pad('Field', 26) + pad('Length', 8) + pad('Limit', 7) + 'OK');
for (const r of rows) {
  console.log(pad(r.lang, 6) + pad(r.field, 26) + pad(r.length, 8) + pad(r.limit, 7) + (r.ok ? 'OK' : 'OVER/MISSING'));
}

console.log('\n' + (anyOver ? 'RESULT: one or more fields are over limit or missing — see OVER/MISSING rows above.' : 'RESULT: all fields within limits.'));
process.exit(anyOver ? 1 : 0);
