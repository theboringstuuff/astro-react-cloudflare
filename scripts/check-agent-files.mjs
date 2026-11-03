// What AI assistants and agents read, checked after the build (`pnpm run check:agents`, part of `pnpm run verify`
// and of the CI):
//   - every indexed page links to its Markdown version, the file exists, says which page it is and has its title;
//   - every block of structured data is valid JSON, and the home page declares the WebSite;
//   - each language has its llms.txt and llms-full.txt, and every address of the site they list exists;
//   - robots.txt lets the robots in, and the Markdown files are served as UTF-8 and kept out of search results.
//   node scripts/check-agent-files.mjs [dist/client]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist/client';
const errors = [];
const fail = (where, what) => errors.push(`${where}: ${what}`);

if (!existsSync(join(dist, 'index.html'))) {
	console.error(`${dist}/index.html not found: run the build first`);
	process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const files = walk(dist);
const site = new URL(readFileSync(join(dist, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/)[1]).origin;
// an address of the site -> the file that answers it (a page folder, or the file itself)
const fileFor = (url) => {
	const p = decodeURI(new URL(url).pathname);
	return [join(dist, p), join(dist, p, 'index.html')].find((f) => existsSync(f) && statSync(f).isFile());
};

let pages = 0;
const langs = new Set();
for (const file of files.filter((f) => f.endsWith('.html'))) {
	const where = `/${relative(dist, file)}`;
	const html = readFileSync(file, 'utf8');

	for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
		try {
			JSON.parse(json);
		} catch (e) {
			fail(where, `structured data is not valid JSON (${e.message})`);
		}
	}
	if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
	pages++;

	const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
	const md = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/)?.[1];
	if (!md) {
		fail(where, 'no <link rel="alternate" type="text/markdown"> in <head>');
		continue;
	}
	const mdFile = fileFor(md);
	if (!mdFile) {
		fail(where, `${md} was not written`);
		continue;
	}
	const text = readFileSync(mdFile, 'utf8');
	if (!text.startsWith('---\n') || !text.includes(`\nurl: "${canonical}"\n`)) fail(md, `its front matter does not name ${canonical}`);
	if (!/^# \S/m.test(text)) fail(md, 'no title (# …) in the text');
	if (/<[a-z][^>]*>/i.test(text.replace(/^---[\s\S]*?\n---\n/, '').replace(/`[^`]*`/g, ''))) fail(md, 'HTML left in the Markdown');
	langs.add(new URL(canonical).pathname.split('/')[1].length === 2 ? new URL(canonical).pathname.split('/')[1] : '');

	if (new URL(canonical).pathname.replace(/^\/[a-z]{2}\//, '/') === '/') {
		const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, j]) => {
			const data = JSON.parse(j);
			return data['@graph'] ?? [data];
		});
		if (!graph.some((n) => n['@type'] === 'WebSite')) fail(where, 'the home page declares no WebSite');
	}
}

// the Worker that answers Accept: text/markdown is in the config wrangler deploys (integrations/agents.mjs puts it back)
const wrangler = JSON.parse(readFileSync(join(dist, 'wrangler.json'), 'utf8'));
if (!wrangler.main || !existsSync(join(dist, wrangler.main))) fail('/wrangler.json', `no Worker script to deploy (main: ${wrangler.main})`);
if (wrangler.assets?.binding !== 'ASSETS') fail('/wrangler.json', 'the Worker has no ASSETS binding');

for (const lang of langs) {
	const prefix = lang ? `/${lang}` : '';
	for (const name of ['llms.txt', 'llms-full.txt']) {
		const file = join(dist, prefix, name);
		if (!existsSync(file)) {
			fail(`${prefix}/${name}`, 'missing');
			continue;
		}
		if (name === 'llms-full.txt') continue;
		const text = readFileSync(file, 'utf8');
		if (!/^# \S/.test(text) || !/\n> \S/.test(text)) fail(`${prefix}/${name}`, 'should open with « # name » and a « > summary » line');
		for (const [, url] of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
			if (url.startsWith(site) && !fileFor(url)) fail(`${prefix}/${name}`, `${url} does not exist`);
		}
	}
}

const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('/robots.txt', 'a robot is shut out of the whole site');
if (!/^Sitemap: /m.test(robots)) fail('/robots.txt', 'no Sitemap line');
const headers = readFileSync(join(dist, '_headers'), 'utf8');
if (!/^\/\*\.md\n(\s+.+\n)*\s+Content-Type: text\/markdown; charset=utf-8/m.test(headers)) fail('/_headers', 'the Markdown files are not served as text/markdown; charset=utf-8');
if (!/^\/\*\.md\n(\s+.+\n)*\s+X-Robots-Tag: noindex/m.test(headers)) fail('/_headers', 'the Markdown files are not kept out of search results');

if (errors.length) {
	console.error(errors.map((e) => `✗ ${e}`).join('\n'));
	console.error(`\n${errors.length} problem(s)`);
	process.exit(1);
}
console.log(`✓ ${pages} pages with their Markdown, llms.txt in ${langs.size} languages, structured data valid, robots.txt and _headers in place`);
