// The Worker in front of the site: every page is prerendered (dist/client), this only answers the question an AI agent
// asks in its Accept header. A request that prefers Markdown (`Accept: text/markdown`) gets the page's Markdown version
// (written at build time by integrations/agents.mjs) at the page's own address; every other request, every browser,
// gets the static file exactly as before. It runs first only on page addresses (run_worker_first in wrangler.jsonc):
// the images, scripts, fonts, .md and .txt files are served straight from the assets, without it.
import { isLang } from './i18n/config';

interface Env {
	ASSETS: { fetch(request: Request): Promise<Response> };
}

// the quality the client gives a media type in its Accept header (RFC 9110): the exact type if it is listed, otherwise
// the best wildcard that covers it (`text/*`, `*/*`), otherwise 0
function quality(accept: string, type: string): number {
	let exact = -1;
	let wildcard = 0;
	for (const part of accept.split(',')) {
		const [range = '', ...params] = part.trim().toLowerCase().split(';');
		const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
		const value = q ? Number(q.slice(2)) || 0 : 1;
		if (range.trim() === type) exact = Math.max(exact, value);
		else if (range.trim() === `${type.split('/')[0]}/*` || range.trim() === '*/*') wildcard = Math.max(wildcard, value);
	}
	return exact >= 0 ? exact : wildcard;
}

// Markdown only when it is named, and preferred to HTML (a browser's */* never turns a page into Markdown)
export function wantsMarkdown(accept: string): boolean {
	const md = quality(accept, 'text/markdown');
	return /text\/markdown/i.test(accept) && md > 0 && md >= quality(accept, 'text/html');
}

// the same rule as markdown() in src/i18n/routes.ts: /en/about/ -> /en/about.md, / -> /index.md, /en/ -> /en/index.md
export function markdownPath(pathname: string): string | null {
	if (!pathname.endsWith('/')) return null;
	if (pathname === '/') return '/index.md';
	const parts = pathname.split('/');
	return parts.length === 3 && isLang(parts[1]) ? `${pathname}index.md` : `${pathname.slice(0, -1)}.md`;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const md = request.method === 'GET' || request.method === 'HEAD' ? markdownPath(url.pathname) : null;

		if (md && wantsMarkdown(request.headers.get('accept') ?? '')) {
			const found = await env.ASSETS.fetch(new Request(new URL(md, url), request));
			if (found.ok) {
				const response = new Response(found.body, found);
				response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
				response.headers.set('Content-Location', md);
				response.headers.set('Vary', 'Accept');
				// the page is the one to show in search results, as for the .md address itself
				response.headers.set('X-Robots-Tag', 'noindex');
				return response;
			}
		}

		const response = await env.ASSETS.fetch(request);
		if (!md || !(response.headers.get('content-type') ?? '').startsWith('text/html')) return response;
		// the same address answers in two formats: caches must keep them apart, and an agent learns where the Markdown is
		const page = new Response(response.body, response);
		page.headers.append('Vary', 'Accept');
		if (response.ok) page.headers.append('Link', `<${md}>; rel="alternate"; type="text/markdown"`);
		return page;
	},
};
