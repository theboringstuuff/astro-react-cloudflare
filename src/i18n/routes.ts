import { DEFAULT_LANG, LANGS, SITE_URL, isLang, type Lang } from './config';

// Every page lives in src/pages/[...lang]/: `lang` is undefined for the default language (the root) and the code for the others.
export const langPaths = () => LANGS.map((lang) => ({ params: { lang: lang === DEFAULT_LANG ? undefined : lang } }));

// the language of the page being built, read from its address (/en/about/ -> 'en', /about/ -> DEFAULT_LANG)
export function langFromUrl(url: URL): Lang {
	const first = url.pathname.split('/')[1];
	return isLang(first) ? first : DEFAULT_LANG;
}

// the page's address without its language: /en/blog/hello/ -> /blog/hello/
export function pathWithoutLang(pathname: string): string {
	const parts = pathname.split('/');
	const rest = isLang(parts[1]) ? '/' + parts.slice(2).join('/') : pathname;
	return withSlash(rest || '/');
}

// pages are folders (about/index.html): their address ends with a slash, which saves a redirect on every click
function withSlash(path: string): string {
	const [p, hash = ''] = path.split('#');
	const clean = p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`;
	return hash ? `${clean}#${hash}` : clean;
}

// a link to a page of the site in a given language: href('en', '/about') -> /en/about/
export function href(lang: Lang, path: string): string {
	const p = withSlash(path.startsWith('/') ? path : `/${path}`);
	return lang === DEFAULT_LANG ? p : `/${lang}${p === '/' ? '/' : p}`;
}

// the full address, for canonical, hreflang, the sitemap and Open Graph
export const absolute = (lang: Lang, path: string) => SITE_URL + href(lang, path);

// the page's text as Markdown, for AI assistants and agents (written at build time by integrations/agents.mjs):
// a folder page gets the file of the same name, the home page index.md. /en/about/ -> /en/about.md, / -> /index.md
export const markdown = (lang: Lang, path: string) => {
	const page = withSlash(path.startsWith('/') ? path : `/${path}`).split('#')[0];
	const file = page === '/' ? '/index.md' : page.endsWith('/') ? `${page.slice(0, -1)}.md` : page;
	return SITE_URL + (lang === DEFAULT_LANG ? file : `/${lang}${file}`);
};
