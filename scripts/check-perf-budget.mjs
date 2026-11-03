// The performance budget, checked on the build (`pnpm check:perf`, part of `pnpm verify` and of the CI). Sizes are
// measured compressed with Brotli, as Cloudflare serves them. Every page of dist/client is read, and the build fails
// when one of them:
//   - weighs more than HTML_KB (the HTML with its inlined stylesheet and inline scripts);
//   - loads more than JS_KB of JavaScript (inline and external scripts together);
//   - hydrates a React island (<astro-island>) that ISLANDS does not allow on that page;
//   - links a render-blocking stylesheet, or loads a script, style, image, font or frame from another origin;
//   - preloads more than PRELOADS files, or lists font files heavier than FONT_KB together;
//   - has an <img> without width, height and alt (layout shift, accessibility), or an image over IMAGE_KB.
// Raise a number only on purpose, in the same pull request as the reason (DESIGN.md: weight is a design decision).
//   node scripts/check-perf-budget.mjs [dist/client]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

const HTML_KB = 20;
const JS_KB = 10;
const FONT_KB = 80;
const IMAGE_KB = 150;
const PRELOADS = 2;
// pages allowed to hydrate React, and how many islands each: { '/en/contact/': 1 }. Empty: React never reaches the browser
const ISLANDS = {};

const dist = process.argv[2] ?? 'dist/client';
if (!existsSync(join(dist, 'index.html'))) {
	console.error(`${dist}/index.html not found: run the build first`);
	process.exit(1);
}

const kb = (bytes) => bytes / 1024;
const br = (buffer) => brotliCompressSync(buffer, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const files = walk(dist);
const local = (url) => {
	const file = join(dist, decodeURI(url.split(/[?#]/)[0]));
	return existsSync(file) && statSync(file).isFile() ? file : null;
};

const errors = [];
const rows = [];
for (const file of files.filter((f) => f.endsWith('.html'))) {
	const page = `/${relative(dist, file)}`.replace(/index\.html$/, '');
	const html = readFileSync(file, 'utf8');
	const fail = (what) => errors.push(`${page}: ${what}`);

	const htmlKb = kb(br(Buffer.from(html)));
	if (htmlKb > HTML_KB) fail(`HTML ${htmlKb.toFixed(1)} kB > ${HTML_KB} kB`);

	// JavaScript: inline scripts (not JSON data) and external ones
	let js = 0;
	for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
		if (/type="(application\/ld\+json|speculationrules|application\/json)"/.test(attrs)) continue;
		const src = attrs.match(/\bsrc="([^"]+)"/)?.[1];
		if (!src) js += br(Buffer.from(body));
		else if (/^(https?:)?\/\//.test(src)) fail(`script from another origin: ${src}`);
		else if (local(src)) js += br(readFileSync(local(src)));
		else fail(`script ${src} not found in the build`);
	}
	for (const [, src] of html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)) if (local(src)) js += br(readFileSync(local(src)));
	if (kb(js) > JS_KB) fail(`JavaScript ${kb(js).toFixed(1)} kB > ${JS_KB} kB`);

	const islands = (html.match(/<astro-island\b/g) ?? []).length;
	const allowed = ISLANDS[page] ?? 0;
	if (islands > allowed) fail(`${islands} React island(s) hydrated, ${allowed} allowed (ISLANDS in this script)`);

	for (const [tag] of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)) fail(`render-blocking stylesheet: ${tag}`);
	for (const [, , url] of html.matchAll(/<(img|iframe|source|video|audio)\b[^>]*\bsrcs?e?t?="((?:https?:)?\/\/[^"\s]+)/g)) fail(`media from another origin: ${url}`);
	for (const [tag, url] of html.matchAll(/<link\b[^>]*rel="(?:preload|modulepreload|icon|manifest)"[^>]*href="((?:https?:)?\/\/[^"]+)"[^>]*>/g)) fail(`asset from another origin: ${url} (${tag})`);

	const preloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
	if (preloads.length > PRELOADS) fail(`${preloads.length} preloads > ${PRELOADS}`);
	for (const p of preloads) if (!local(p)) fail(`preload ${p} not found in the build`);

	// fonts: every file the page's @font-face rules can fetch (unicode-range subsets included: worst case)
	const fonts = [...new Set([...html.matchAll(/url\((\/_astro\/[^)]+\.woff2?)\)/g)].map((m) => m[1]))];
	const fontKb = fonts.reduce((sum, f) => sum + (local(f) ? kb(statSync(local(f)).size) : 0), 0);
	if (fontKb > FONT_KB) fail(`fonts ${fontKb.toFixed(0)} kB > ${FONT_KB} kB (${fonts.length} files)`);
	for (const p of preloads.filter((p) => /\.woff2?$/.test(p))) if (!fonts.includes(p)) fail(`preloaded font ${p} is not used by any @font-face (fetched twice)`);

	for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
		if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) fail(`<img> without width and height: ${tag.slice(0, 120)}`);
		if (!/\balt="/.test(tag)) fail(`<img> without alt: ${tag.slice(0, 120)}`);
		const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
		if (src && local(src) && kb(statSync(local(src)).size) > IMAGE_KB) fail(`image ${src} ${kb(statSync(local(src)).size).toFixed(0)} kB > ${IMAGE_KB} kB`);
	}

	rows.push({ page, html: htmlKb, js: kb(js), fonts: fontKb, islands });
}

console.log('page                         html(br)   js(br)   fonts   islands');
for (const r of rows.sort((a, b) => a.page.localeCompare(b.page))) {
	console.log(`${r.page.padEnd(28)} ${`${r.html.toFixed(1)} kB`.padStart(8)} ${`${r.js.toFixed(1)} kB`.padStart(8)} ${`${r.fonts.toFixed(0)} kB`.padStart(7)} ${String(r.islands).padStart(9)}`);
}
if (errors.length) {
	console.error(`\n${errors.map((e) => `✗ ${e}`).join('\n')}\n\n${errors.length} budget problem(s)`);
	process.exit(1);
}
console.log(`\n✓ ${rows.length} pages within budget (HTML ${HTML_KB} kB, JS ${JS_KB} kB, fonts ${FONT_KB} kB, Brotli)`);
