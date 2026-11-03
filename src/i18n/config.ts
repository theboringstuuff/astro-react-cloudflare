// The languages of the site: one table, read by the routes, the <html> tag, the switcher, hreflang, the sitemap,
// Open Graph and i18next (astro.config.mjs). The default language sits at the root (/about/), the others under their
// code (/en/about/). Adding a language = one line here + its folder in src/locales/ (`pnpm i18n:check` lists what is
// missing). `dir: 'rtl'` is all an Arabic or Hebrew locale needs: the layout uses logical properties (ms-*, ps-*, start-*).

export const LOCALES = [
	{ code: 'fr', name: 'Français', htmlLang: 'fr', hreflang: 'fr', og: 'fr_FR', dir: 'ltr' },
	{ code: 'en', name: 'English', htmlLang: 'en', hreflang: 'en', og: 'en_US', dir: 'ltr' },
] as const;

export type Lang = (typeof LOCALES)[number]['code'];
export const DEFAULT_LANG: Lang = 'fr';
export const LANGS = LOCALES.map((l) => l.code) as Lang[];

export const locale = (lang: Lang) => LOCALES.find((l) => l.code === lang)!;

export const isLang = (value: string | undefined): value is Lang => !!value && (LANGS as string[]).includes(value);

// The i18next namespaces: one file per area of the site and per language, src/locales/<lang>/<namespace>.json.
// The default language's files (src/locales/fr/) are the reference: their keys type every call to t() (see t.ts).
export const NAMESPACES = ['common', 'home', 'about'] as const;
export type Namespace = (typeof NAMESPACES)[number];

// The address the site is served from in production: canonical links, hreflang, the sitemap, robots.txt, llms.txt
// and Open Graph read it (astro.config.mjs too). Change it before the first deploy.
export const SITE_URL = 'https://example.com';
