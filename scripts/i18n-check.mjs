#!/usr/bin/env node
// Compares every language to the reference language (DEFAULT_LANG, French here), namespace by namespace (src/locales/<lang>/<namespace>.json): missing or extra
// keys, list lengths, {{placeholders}} and HTML tags that differ, plural forms that do not match the language's rules,
// and values identical to French (a forgotten sentence; names and numbers are legitimately the same, so those are
// only listed). A key missing at run time shows as the key itself on the page (i18next has no fallback language here).
//   node scripts/i18n-check.mjs            -> report, exit 1 on any error
//   node scripts/i18n-check.mjs --same     -> also print the values identical to French
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv.find((a) => a.startsWith('--root='))?.slice(7) ?? '.');
const showSame = process.argv.includes('--same');
const locales = join(root, 'src/locales');
const config = readFileSync(join(root, 'src/i18n/config.ts'), 'utf8');
// the reference language is DEFAULT_LANG (src/i18n/config.ts): every other language is compared to it
const REF = config.match(/DEFAULT_LANG: Lang = '([a-z]+)'/)?.[1] ?? 'fr';
const langs = [...config.matchAll(/code: '([a-z]+)'/g)].map((m) => m[1]).filter((l) => l !== REF);
const namespaces = readdirSync(join(locales, REF))
	.filter((f) => f.endsWith('.json'))
	.map((f) => f.slice(0, -5));

const read = (lang, ns) => JSON.parse(readFileSync(join(locales, lang, `${ns}.json`), 'utf8'));
const placeholders = (s) => [...new Set([...s.matchAll(/\{\{\s*([a-zA-Z]+)[^}]*\}\}/g)].map((m) => m[1]))].sort();
const tags = (s) => [...s.matchAll(/<\/?([a-z]+)/g)].map((m) => m[0]).sort().join(',');

// plural keys (adults_one, adults_few…): grouped under their base key, checked against the language's own forms
const FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'];
const pluralBase = (key) => {
	const m = key.match(/^(.+)_(zero|one|two|few|many|other)$/);
	return m ? m[1] : null;
};
const forms = (lang) => new Intl.PluralRules(lang).resolvedOptions().pluralCategories;

let errors = 0;
const same = [];
const fail = (msg) => (errors++, console.log(`✗ ${msg}`));

function compareText(where, fr, other) {
	if (typeof other !== 'string') return fail(`${where}: not a text`);
	const [a, b] = [placeholders(fr).join(','), placeholders(other).join(',')];
	if (a !== b) fail(`${where}: placeholders {{${a}}} ≠ {{${b}}}`);
	if (tags(fr) !== tags(other)) fail(`${where}: HTML ${tags(fr)} ≠ ${tags(other)}`);
	if (fr === other && !where.startsWith(`${REF}/`) && /[a-zà-ÿ]{4}/i.test(fr)) same.push(`${where}: ${fr.slice(0, 70)}`);
}

function compare(ns, lang, fr, other, path = '') {
	const where = `${lang}/${ns} ${path}`;
	if (typeof fr === 'string') return compareText(where, fr, other);
	if (Array.isArray(fr)) {
		if (!Array.isArray(other) || other.length !== fr.length)
			return fail(`${where}: list of ${fr.length}, got ${Array.isArray(other) ? other.length : typeof other}`);
		return fr.forEach((v, i) => compare(ns, lang, v, other[i], `${path}[${i}]`));
	}
	if (fr && typeof fr === 'object') {
		if (!other || typeof other !== 'object') return fail(`${where}: not an object`);
		const key = (k) => (path ? `${path}.${k}` : k);
		const plural = new Set(Object.keys(fr).map(pluralBase).filter(Boolean));
		for (const base of plural) {
			const want = forms(lang);
			const have = Object.keys(other).filter((k) => pluralBase(k) === base).map((k) => k.slice(base.length + 1));
			const missing = want.filter((f) => !have.includes(f));
			const extra = have.filter((f) => !want.includes(f));
			if (missing.length) fail(`${lang}/${ns} ${key(base)}: plural forms missing for ${lang}: ${missing.join(', ')}`);
			if (extra.length) fail(`${lang}/${ns} ${key(base)}: plural forms ${lang} does not use: ${extra.join(', ')}`);
			// every form may drop {{count}} (« بالغ واحد »), but may not bring a placeholder French does not have
			const allowed = placeholders(fr[`${base}_other`] ?? '');
			for (const f of have) {
				const text = other[`${base}_${f}`];
				const unknown = placeholders(text).filter((p) => !allowed.includes(p));
				if (unknown.length) fail(`${lang}/${ns} ${key(`${base}_${f}`)}: placeholders {{${unknown.join(',')}}} not in French`);
				if (tags(text) !== tags(fr[`${base}_other`] ?? '')) fail(`${lang}/${ns} ${key(`${base}_${f}`)}: HTML differs from French`);
			}
		}
		for (const k of Object.keys(fr)) {
			if (pluralBase(k) && plural.has(pluralBase(k))) continue;
			if (!(k in other)) fail(`${where}.${k}: missing`.replace(' .', ' '));
			else compare(ns, lang, fr[k], other[k], key(k));
		}
		for (const k of Object.keys(other)) {
			if (pluralBase(k) && plural.has(pluralBase(k)) && FORMS.includes(k.slice(pluralBase(k).length + 1))) continue;
			if (!(k in fr)) fail(`${where}.${k}: not in French`.replace(' .', ' '));
		}
		return;
	}
	if (fr !== other) fail(`${where}: ${fr} ≠ ${other} (numbers and flags stay as in French)`);
}

for (const ns of namespaces) {
	const fr = read(REF, ns);
	// French against itself: its plural keys must have every form French uses (one, many, other)
	compare(ns, REF, fr, fr);
	for (const lang of langs) {
		if (!existsSync(join(locales, lang, `${ns}.json`))) {
			fail(`${lang}/${ns}: no file`);
			continue;
		}
		compare(ns, lang, fr, read(lang, ns));
	}
}
for (const lang of langs) {
	const dir = join(locales, lang);
	if (!existsSync(dir)) continue;
	for (const f of readdirSync(dir)) if (!namespaces.includes(f.replace(/\.json$/, ''))) fail(`${lang}/${f}: no such namespace in French`);
}

console.log(`values identical to French: ${same.length}${showSame ? '' : ' (--same to list them)'}`);
if (showSame) same.forEach((s) => console.log('  = ' + s));
console.log(errors ? `${errors} error(s)` : `structure OK: ${namespaces.length} namespaces × ${langs.length} languages`);
process.exit(errors ? 1 : 0);
