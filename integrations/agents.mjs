// The site as AI assistants and agents read it, written once the site is built (after the sitemap, from the same
// pages): every page also as Markdown, and an llms.txt per language (https://llmstxt.org) that lists them.
//
//   /about/           ->  /about.md             the text of the page: its <main> and its footer, nothing else
//   /en/about/        ->  /en/about.md        (the address comes from the page's <link rel="alternate"
//   /                 ->  /index.md              type="text/markdown">, written by src/layouts/Layout.astro)
//   /llms.txt, /en/llms.txt …                    the site in a few lines, then each page with its description
//   /llms-full.txt, /en/llms-full.txt …          every page of the language, one after the other
//
// Reading the build instead of the sources means the Markdown says exactly what the page says, in every language,
// and a new page gets its file without anyone thinking of it. Pages that ask not to be indexed (the 404)
// are left out. The Markdown files are served with `X-Robots-Tag: noindex` (public/_headers): search engines keep
// the HTML page as the one to show, assistants read the light version.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { NodeHtmlMarkdown } from 'node-html-markdown';

// what a reader of the text has no use for: pictures, icons, controls, forms (an agent cannot send them), embeds,
// and everything the page hides from screen readers
const DROP = [
	'script',
	'style',
	'noscript',
	'template',
	'svg',
	'img',
	'picture',
	'video',
	'iframe',
	'form',
	'button',
	'input',
	'select',
	'textarea',
	'dialog',
	'[hidden]',
	'[aria-hidden="true"]',
	// the language switcher of the footer: the front matter lists the other languages
	'[data-lang-switch]',
	// « (new tab) » is said to screen readers; in a text file it is noise
	'a[target="_blank"] .sr-only',
].join(', ');

// pages listed under « Optional » in llms.txt (legal notices…): an assistant only needs them when asked about them
const SECONDARY = ['/legal/', '/privacy/'];

const nhm = new NodeHtmlMarkdown({ bulletMarker: '-', useInlineLinks: true, maxConsecutiveNewlines: 2 });

const attr = (root, selector, name) => root.querySelector(selector)?.getAttribute(name) ?? '';
const decode = (s) => parse(`<p>${s}</p>`).text;
// YAML: every value quoted, so a colon or a quote in a title never breaks the front matter
const yaml = (s) => JSON.stringify(s);

/** @param {{ site: string, langs: { code: string, name: string, hreflang: string }[], fallback: string }} options */
export default function agents({ site, langs, fallback }) {
	const codes = new Set(langs.map((l) => l.code).filter((c) => c !== fallback));
	const origin = new URL(site).origin;
	// the rule of src/i18n/routes.ts (markdown()), repeated here to check every page's link against it
	const mdUrl = (pageUrl) => {
		const u = new URL(pageUrl);
		const parts = u.pathname.split('/');
		const lang = codes.has(parts[1]) ? parts[1] : '';
		const p = lang ? `/${parts.slice(2).join('/')}` : u.pathname;
		const file = p === '/' ? '/index.md' : p.endsWith('/') ? `${p.slice(0, -1)}.md` : p;
		return `${origin}${lang ? `/${lang}` : ''}${file}`;
	};

	/** the text of a page as Markdown, links made absolute so they still work out of context */
	function toMarkdown(root, pageUrl) {
		const parts = [root.querySelector('main'), root.querySelector('footer')].filter(Boolean);
		for (const part of parts) {
			for (const el of part.querySelectorAll(DROP)) el.remove();
			// an element laid out as a block (Tailwind's block, flex, grid), or sitting in a flex or grid container, has no
			// space around it in the HTML: two words side by side on screen would run together once flat
			const pad = (el) => {
				el.insertAdjacentHTML('beforebegin', ' ');
				el.insertAdjacentHTML('afterend', ' ');
			};
			for (const el of part.querySelectorAll('[class]')) {
				if (/(^|\s)([a-z0-9]+:)*(block|flex|grid|inline-block|inline-flex|inline-grid)(\s|$)/.test(el.getAttribute('class'))) {
					pad(el);
					for (const child of el.childNodes.filter((n) => n.nodeType === 1)) pad(child);
				}
			}
			for (const a of part.querySelectorAll('a[href]')) {
				const target = a.getAttribute('href');
				// a link to a part of the same page (#section) is only text once the page is flat
				if (target.startsWith('#')) a.replaceWith(a.innerHTML);
				else if (!/^(mailto|tel):/.test(target)) a.setAttribute('href', new URL(target, pageUrl).href);
			}
			// a line break inside a title (set for the layout) would cut the Markdown heading in two
			for (const br of part.querySelectorAll('h1 br, h2 br, h3 br, h4 br')) br.replaceWith(' ');
		}
		return parts
			.map((part) => nhm.translate(part.innerHTML))
			.join('\n\n---\n\n')
			// two links side by side in the page would run into each other
			.replace(/\) ?\[/g, ') · [')
			// an arrow icon taken out of a link leaves a space at its start
			.replace(/\[\s+/g, '[')
			// and a space at the start of a line (a list nested in a list keeps its two)
			.replace(/^ (?! )/gm, '')
			.replace(/[ \t]+$/gm, (m) => (m === '  ' ? m : ''))
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	return {
		name: 'agents',
		hooks: {
			'astro:build:done': ({ dir, pages, logger }) => {
				const out = fileURLToPath(dir);
				/** @type {Map<string, { path: string, url: string, md: string, title: string, description: string, body: string, home: any }[]>} */
				const byLang = new Map(langs.map((l) => [l.code, []]));

				for (const { pathname } of pages) {
					const p = `/${pathname}`.replace(/\/?$/, '/');
					const file = [join(out, p, 'index.html'), join(out, `${p.slice(0, -1)}.html`)].find((f) => existsSync(f));
					if (!file) continue;
					const html = readFileSync(file, 'utf8');
					if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
					const root = parse(html);
					const url = attr(root, 'link[rel="canonical"]', 'href');
					const md = attr(root, 'link[rel="alternate"][type="text/markdown"]', 'href');
					if (!url || !md) throw new Error(`${p}: no canonical or no Markdown link in <head>`);
					if (md !== mdUrl(url)) throw new Error(`${p}: the Markdown link ${md} is not ${mdUrl(url)} (routes.ts and agents.mjs disagree)`);

					const first = p.split('/')[1];
					const lang = codes.has(first) ? first : fallback;
					const title = decode(root.querySelector('title')?.innerHTML ?? '');
					const description = decode(attr(root, 'meta[name="description"]', 'content'));
					const ld = root.querySelector('script[type="application/ld+json"]')?.textContent;
					const alternates = root
						.querySelectorAll('link[rel="alternate"][hreflang]')
						.filter((l) => l.getAttribute('hreflang') !== 'x-default')
						.map((l) => `  ${l.getAttribute('hreflang')}: ${yaml(mdUrl(l.getAttribute('href')))}`);
					// the bidi isolates that keep numbers in order inside RTL text (U+2066…U+2069) are only noise in a
					// left-to-right text file
					const rtl = root.querySelector('html')?.getAttribute('dir') === 'rtl';
					const body = rtl ? toMarkdown(root, url) : toMarkdown(root, url).replace(/[\u2066-\u2069]/g, '');
					const front = [
						'---',
						`title: ${yaml(title)}`,
						`description: ${yaml(description)}`,
						`url: ${yaml(url)}`,
						`lang: ${yaml(root.querySelector('html')?.getAttribute('lang') ?? lang)}`,
						'alternates:',
						...alternates,
						'---',
					].join('\n');
					const target = join(out, new URL(md).pathname);
					mkdirSync(dirname(target), { recursive: true });
					writeFileSync(target, `${front}\n\n${body}\n`);
					const path = lang === fallback ? p : p.slice(first.length + 1);
					byLang.get(lang).push({ path, url, md, title, description, body, home: path === '/' && ld ? JSON.parse(ld) : null });
				}

				let files = 0;
				for (const [code, list] of byLang) {
					if (list.length === 0) continue;
					files += list.length;
					list.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
					const prefix = code === fallback ? '' : `/${code}`;
					const home = list[0];
					// the site's name and summary come from the home page's structured data (src/data/schema.ts)
					const graph = home.home?.['@graph'] ?? [home.home].filter(Boolean);
					const website = graph.find((n) => n['@type'] === 'WebSite') ?? {};
					const line = (e) => `- [${e.title.split(' — ')[0]}](${e.md}): ${e.description}`;
					const main = list.filter((e) => !SECONDARY.includes(e.path));
					const secondary = list.filter((e) => SECONDARY.includes(e.path));
					const others = langs.filter((l) => l.code !== code && byLang.get(l.code)?.length);
					const llms = [
						`# ${website.name ?? home.title}`,
						'',
						`> ${home.description}`,
						'',
						'Each page of the site exists as HTML (the address to share or cite) and as Markdown (the links below).',
						'',
						'## Pages',
						'',
						...main.map(line),
						'',
						...(others.length
							? ['## Other languages', '', ...others.map((l) => `- [${l.name}](${origin}${l.code === fallback ? '' : `/${l.code}`}/llms.txt)`), '']
							: []),
						'## Optional',
						'',
						`- [Every page in one file](${origin}${prefix}/llms-full.txt)`,
						...secondary.map(line),
						'',
					].join('\n');
					const full = list
						.map((e) => `<!-- ${e.url} -->\n# ${e.title}\n\n> ${e.description}\n\n${e.body}`)
						.join('\n\n---\n\n');
					mkdirSync(join(out, prefix), { recursive: true });
					writeFileSync(join(out, prefix, 'llms.txt'), llms);
					writeFileSync(join(out, prefix, 'llms-full.txt'), `${full}\n`);
				}
				logger.info(`${files} Markdown pages, llms.txt and llms-full.txt in ${[...byLang.values()].filter((l) => l.length).length} languages`);

				// The Worker that answers `Accept: text/markdown` (src/worker.ts, declared in wrangler.jsonc). For a fully
				// static site the adapter writes a config for assets only and drops `main` and the ASSETS binding: put them
				// back in the config it wrote, so `wrangler deploy` (and `wrangler dev`) bundles the Worker with the site.
				const config = join(out, 'wrangler.json');
				if (!existsSync(config)) throw new Error(`${config} not found: the Cloudflare adapter did not write its config`);
				const wrangler = JSON.parse(readFileSync(config, 'utf8'));
				const user = readFileSync(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)), 'utf8');
				const main = user.match(/"main":\s*"([^"]+)"/)?.[1];
				if (main) {
					wrangler.main = relative(out, fileURLToPath(new URL(`../${main.replace(/^\.\//, '')}`, import.meta.url)));
					wrangler.assets = { ...wrangler.assets, binding: 'ASSETS' };
					writeFileSync(config, JSON.stringify(wrangler));
					logger.info(`wrangler.json: Worker ${main} in front of the assets`);
				}
			},
		},
	};
}
