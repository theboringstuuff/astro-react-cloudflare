// Writes dist/sitemap.xml once the site is built, from the pages actually produced: every page in every language,
// each listing its versions in the other languages (hreflang) and the default language's one as x-default. Pages that ask not to
// be indexed (<meta name="robots" content="noindex">, the 404) are left out. Reading the build instead of a list of
// routes means a new page or a new room is in the sitemap without anyone thinking of it.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** @param {{ site: string, langs: { code: string, hreflang: string }[], fallback: string }} options */
export default function sitemap({ site, langs, fallback }) {
	const codes = new Set(langs.map((l) => l.code).filter((c) => c !== fallback));
	const url = (code, path) => `${site}${code === fallback ? '' : `/${code}`}${path}`;

	return {
		name: 'sitemap',
		hooks: {
			'astro:build:done': ({ dir, pages, logger }) => {
				const out = fileURLToPath(dir);
				// '' -> '/', 'en/about/' -> ['en', '/about/']
				const groups = new Map();
				for (const { pathname } of pages) {
					const p = `/${pathname}`.replace(/\/?$/, '/');
					const first = p.split('/')[1];
					const code = codes.has(first) ? first : fallback;
					const path = code === fallback ? p : p.slice(first.length + 1);
					const file = [join(out, p, 'index.html'), join(out, `${p.slice(0, -1)}.html`)].find((f) => existsSync(f));
					if (!file) continue;
					const html = readFileSync(file, 'utf8');
					if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
					if (!groups.has(path)) groups.set(path, new Set());
					groups.get(path).add(code);
				}

				const entries = [];
				for (const [path, have] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
					const alternates = langs
						.filter((l) => have.has(l.code))
						.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${url(l.code, path)}"/>`)
						.concat(have.has(fallback) ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(fallback, path)}"/>`] : []);
					for (const l of langs.filter((l) => have.has(l.code))) {
						entries.push(`  <url>\n    <loc>${url(l.code, path)}</loc>\n${alternates.join('\n')}\n  </url>`);
					}
				}
				writeFileSync(
					join(out, 'sitemap.xml'),
					`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`,
				);
				logger.info(`sitemap.xml: ${entries.length} addresses, ${groups.size} pages`);
			},
		},
	};
}
