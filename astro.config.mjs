// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import i18next from '@gutenye/astro-i18next/integration';
import { SITE_URL, LOCALES, LANGS, DEFAULT_LANG, NAMESPACES } from './src/i18n/config.ts';
import sitemap from './integrations/sitemap.mjs';
import agents from './integrations/agents.mjs';

// https://astro.build/config
// Every page is prerendered to HTML at build time. The Cloudflare adapter builds for Workers: dist/client holds the
// site, served as static assets by the Worker named in wrangler.jsonc (src/worker.ts runs first only on page
// addresses). A page or an API route can opt into server rendering with `export const prerender = false`.
// Languages: src/pages/[...lang]/ builds each page once per language (the default one at the root); the texts are
// i18next namespaces in src/locales/<lang>/<namespace>.json, loaded once at build time by @gutenye/astro-i18next.
export default defineConfig({
	site: SITE_URL,
	output: 'static',
	// pages are folders (/about/index.html): their address ends with a slash, links never pay a redirect
	trailingSlash: 'always',
	adapter: cloudflare({
		// images are optimised at build time (AVIF/WebP): no Cloudflare Images binding to provision or pay for
		imageService: 'compile',
		// i18next is set up in this process when the config loads: the pages must be prerendered in Node to share it.
		// In workerd (the adapter's default) they would see an i18next that was never initialised.
		prerenderEnvironment: 'node',
	}),
	// no sessions: otherwise the adapter provisions a SESSION KV namespace that nothing uses
	session: false,
	// the stylesheet goes inside each page instead of a file of its own: the first paint never waits for a second request
	build: { inlineStylesheets: 'always', format: 'directory' },
	// prefetching is done by the browser itself (Speculation Rules in Layout.astro): no Astro prefetch script
	prefetch: false,
	// no dev toolbar in the screenshots and the Lighthouse runs of `astro dev`
	devToolbar: { enabled: false },
	vite: {
		// Tailwind's utilities (src/styles/global.css is its entry), built from the classes it finds in src
		plugins: [tailwindcss()],
		// the package imports `astro:config/server`, which only Vite can resolve: it is bundled, not loaded by Node
		resolve: { noExternal: ['@gutenye/astro-i18next'] },
		// small assets (icons, tiny SVGs) are inlined; fonts are never inlined, so the preload and the CSS share one URL
		build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
	},
	integrations: [
		// the pages are React views (src/views), rendered to HTML at build time: no client:* directive, no React in the browser
		react(),
		i18next({
			lng: DEFAULT_LANG,
			preload: LANGS,
			ns: [...NAMESPACES],
			// a missing text shows its key (and `pnpm i18n:check` fails) instead of silently falling back
			fallbackLng: false,
			// the files are read synchronously, before the first page renders
			initAsync: false,
			backend: { loadPath: 'src/locales/{{lng}}/{{ns}}.json' },
			// Astro escapes what it prints; texts holding HTML (<em>, links) are printed with dangerouslySetInnerHTML on purpose
			interpolation: { escapeValue: false },
		}),
		sitemap({ site: SITE_URL, langs: [...LOCALES], fallback: DEFAULT_LANG }),
		// every page also as Markdown, and llms.txt per language, for AI assistants and agents (see the file)
		agents({ site: SITE_URL, langs: [...LOCALES], fallback: DEFAULT_LANG }),
	],
});
