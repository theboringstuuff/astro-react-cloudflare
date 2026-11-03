# Architecture

Comment le site est construit, où vit chaque chose, et pourquoi. Pour les règles de travail : `AGENTS.md`. Pour le
design : `DESIGN.md`.

## En une phrase

Astro pré-rend chaque page, dans chaque langue, en HTML statique ; les pages sont écrites en React mais **aucun React
n'est envoyé au navigateur** ; un petit Worker Cloudflare sert ces fichiers depuis le bord du réseau et répond en
Markdown aux agents IA qui le demandent.

```
                    build (Node, CI)                                     requête (Cloudflare)
 src/locales/*.json ─┐
 src/views/*.tsx ────┼─> astro build ─> dist/client/  ──────────────>  Worker (src/worker.ts)
 src/pages/[...lang] ┘    │              ├─ fr/en HTML, CSS inline        ├─ /_astro/*, .md, .txt : assets directs
                          │              ├─ /_astro/* (hashés, immuables) ├─ page + Accept: text/markdown -> page.md
                          ├─ sitemap.mjs ├─ sitemap.xml, robots.txt       └─ page -> HTML (+ Vary, Link: rel=alternate)
                          └─ agents.mjs  └─ *.md, llms.txt, llms-full.txt
```

## Arborescence

```
src/
├── pages/            les routes. [...lang]/ construit chaque page une fois par langue (la langue par défaut à la
│                     racine, les autres sous /en/…). Une route calcule le <head> et rend une vue dans <Layout>
│   ├── 404.astro     une seule 404, traduite avant affichage par un script inline selon l'adresse demandée
│   └── robots.txt.ts robots.txt généré depuis SITE_URL (Content-Signal, robots IA nommés)
├── views/            le contenu des pages, en React (HomePage, AboutPage, NotFoundPage)
├── components/
│   ├── layout/       la coque : SiteHeader, Footer, LangSwitch
│   ├── home/         les sections de l'accueil
│   └── ui/           les petites pièces : ButtonLink, Dot, Img / Picture (images optimisées au build)
├── layouts/          Layout.astro : <head> (SEO, hreflang, OG, JSON-LD, Speculation Rules), coque, scripts
├── i18n/             config.ts (la table des langues), routes.ts (adresses), t.ts (textes typés), react.tsx (hooks)
├── locales/<lang>/   les textes, un fichier par zone (namespace) ; la langue par défaut est la référence
├── data/             ce qui n'est pas du texte : site.ts (liens, menu), schema.ts (données structurées)
├── scripts/          le TypeScript du navigateur (details.ts : fermeture des <details>, choix de langue)
├── styles/           global.css : la seule feuille, tokens de DESIGN.md + thème Tailwind + base
└── worker.ts         le Worker devant les assets
integrations/         sitemap.mjs et agents.mjs : lisent le build terminé et écrivent sitemap, .md, llms.txt
scripts/              les contrôles de `pnpm verify` (tokens, CSS, i18n, fichiers agents, budget perf)
```

## Une page

Trois fichiers, toujours les mêmes :

1. **La route** `src/pages/[...lang]/contact.astro` : `export const getStaticPaths = langPaths`, la langue lue dans
   l'URL (`langFromUrl`), le titre et la description passés à `<Layout>`, la vue rendue dedans.
2. **La vue** `src/views/ContactPage.tsx`, exportée par `withPage(...)` : elle reçoit `lang` et `pathname`, et tous
   les composants en dessous les relisent avec `useLang()`, `usePage()`, `useT('contact')`.
3. **Les textes** `src/locales/<lang>/contact.json` dans **chaque** langue, plus le namespace ajouté à
   `NAMESPACES` (`src/i18n/config.ts`) **et** au type `Resources` (`src/i18n/t.ts`). Oublier l'un des deux fait
   échouer `pnpm check` ou affiche la clé brute.

Un lien interne passe toujours par `href(lang, '/contact')` (préfixe de langue + slash final). Pour qu'elle apparaisse
dans le menu : une entrée dans `NAV` (`src/data/site.ts`) et `nav.<clé>` dans chaque `common.json`. Sitemap, Markdown,
`llms.txt` et hreflang suivent tout seuls : ils lisent le build.

## Les langues

- Une table, `LOCALES` dans `src/i18n/config.ts`, lue par les routes, `<html lang dir>`, le sélecteur, hreflang, le
  sitemap, Open Graph et i18next. Ajouter une langue = une ligne + un dossier `src/locales/<code>/` complet.
- La langue par défaut (`DEFAULT_LANG`) est à la racine, sans préfixe ; c'est la référence : ses fichiers typent
  `t()` et `pnpm i18n:check` compare toutes les autres à elle (clés, longueur des listes, `{{placeholders}}`, balises
  HTML, formes du pluriel selon `Intl.PluralRules` : le français a `one`, `many`, `other`).
- i18next est initialisé une fois au build par `@gutenye/astro-i18next` (licence Elastic 2.0). Chaque page fixe sa
  langue avec `i18n(lang, ns)` → `getFixedT` : ne jamais utiliser le `t` global d'i18next, partagé entre les pages
  rendues en même temps. `fallbackLng: false` : une clé manquante se voit au lieu de retomber en silence.
- Première visite sur `/` : un script inline renvoie vers la langue du navigateur, sauf robots, sauf visite venant du
  site, sauf choix déjà fait dans le sélecteur (gardé dans `localStorage`).
- RTL : `dir: 'rtl'` dans `LOCALES` suffit, à condition d'utiliser les propriétés logiques (`ms-*`, `ps-*`,
  `start-*`, `end-*`) partout.

## Performance : ce qui est fait, et où

| Levier | Où | Effet |
| --- | --- | --- |
| HTML statique, pré-rendu | `output: 'static'` | TTFB d'un fichier servi par le cache du bord |
| CSS en ligne | `build.inlineStylesheets: 'always'` | aucune requête bloquante avant le premier rendu |
| 0 kB de JS par défaut | vues React sans `client:*` | pas d'hydratation, TBT ≈ 0 |
| Une police, un axe | `global.css`, `Layout.astro` | `wght` seul, latin préchargé (~41 kB), latin-ext à la demande via `unicode-range` |
| Fallback métrique | `@font-face 'Bricolage Fallback'` | `size-adjust`/`ascent-override` : le swap ne décale presque rien (CLS) |
| Navigation instantanée | `<script type="speculationrules">` | prerender au survol (Chromium), sans script |
| Transitions de page | `@view-transition` (CSS) | transitions entre documents, sans script ni SPA |
| Révélations au scroll | `[data-reveal]` + `animation-timeline: view()` | CSS pur ; jamais sur l'élément LCP |
| Images | `imageService: 'compile'`, `Img`/`Picture` | AVIF/WebP au build, `width`/`height` toujours posés |
| Cache | `public/_headers` | `/_astro/*` immuable un an ; HTML revalidé |
| Worker minimal | `run_worker_first` | le Worker ne tourne que sur les adresses de pages ; tout le reste est servi par les assets |
| Compression, HTTP/3 | Cloudflare | Brotli/Zstandard automatiques |

Garde-fous : `pnpm check:perf` (budget par page, Brotli) dans `verify` et la CI, et le job **Lighthouse**
(`lighthouserc.cjs`, profil mobile, médiane de 5 passages, performance ≥ 0,95, accessibilité 1).

Côté tableau de bord Cloudflare (hors du code) : laisser **Block AI bots** et le **robots.txt géré** désactivés si le
site veut être lu par les assistants ; Early Hints et Speed Brain peuvent rester activés.

## Le Worker

`src/worker.ts` ne fait qu'une chose : quand une requête sur une page préfère `text/markdown` (en-tête `Accept`), il
renvoie le `.md` de la page à la même adresse ; sinon il passe la main aux assets et ajoute `Vary: Accept` et
`Link: <…md>; rel="alternate"`. Comme le site est entièrement statique, l'adaptateur écrit une config « assets
seulement » ; `integrations/agents.mjs` y remet `main` et le binding `ASSETS` après le build.

**Passer une route en serveur** (formulaire, API, D1) : `export const prerender = false` dans la route, et le binding
dans `wrangler.jsonc`. Le rendu serveur passe alors par l'entrée de l'adaptateur
(`@astrojs/cloudflare/entrypoints/server`, un objet `{ fetch }`) : dans `src/worker.ts`, garder la négociation
Markdown en tête et déléguer le reste à ce `fetch` au lieu de `env.ASSETS`, élargir `run_worker_first` aux routes
serveur, et retirer de `integrations/agents.mjs` la réécriture de `main` si l'adaptateur écrit désormais la sienne.
Vérifier avec `pnpm preview` avant la PR. Le reste du site reste pré-rendu.

## Ajouter du JavaScript (quand c'est vraiment nécessaire)

1. **Un comportement** (menu, onglets, copie dans le presse-papiers) : un module dans `src/scripts/`, importé par un
   `<script>` dans la route ou le layout. Astro le regroupe et l'inline s'il est petit. Pas de React.
2. **Des animations riches** : créer `src/scripts/motion.ts` comme unique point d'entrée (GSAP, ou l'API Web
   Animations), toujours derrière `prefers-reduced-motion: no-preference`, jamais sur l'élément LCP.
3. **Un îlot React** : uniquement si l'état est réellement complexe. Le composant est déclaré avec
   `client:visible` dans le fichier `.astro` (les directives n'existent pas en JSX : passer l'îlot à la vue par un
   slot nommé), et la page est ajoutée à `ISLANDS` dans `scripts/check-perf-budget.mjs`. Compter ~57 kB Brotli (mesuré) pour
   le runtime React.

## Polices

Changer de famille : l'ajouter dans `DESIGN.md` d'abord, puis remplacer les deux `@font-face` de `global.css` et
l'import `?url` de `Layout.astro` (le même fichier, sinon il est téléchargé deux fois — `check:perf` le vérifie).
Mesurer à nouveau `size-adjust`, `ascent-override` et `descent-override` du fallback (métriques `hhea` et avance
moyenne comparée à Arial, par exemple avec `fontTools`). Familles OFL de préférence ; une police commerciale demande
sa licence web avant tout fichier.

## Contrôles (`pnpm verify`)

| Script | Vérifie |
| --- | --- |
| `check:tokens` | chaque token de `DESIGN.md` a la même valeur dans `global.css` (et inversement) |
| `lint:design` | `DESIGN.md` suit la spec (structure, références, contrastes WCAG) |
| `check:css` | `global.css` est la seule feuille de style |
| `i18n:check` | toutes les langues ont les mêmes textes que la langue de référence |
| `check` | `astro check` : 0 erreur, 0 avertissement, 0 indice |
| `build` | le site, le sitemap, les `.md`, `llms.txt` |
| `check:agents` | chaque page a son Markdown, `llms.txt` par langue, JSON-LD valide, `robots.txt` et `_headers` en place |
| `check:perf` | budget par page : HTML, JS, polices, images, aucun tiers, aucun îlot non déclaré |

## CI/CD

- `ci.yml` : sur chaque pull request et sur `main` — `verify`, puis Lighthouse, puis une **Preview** Cloudflare
  `pr-<numéro>` commentée sur la PR (sauf forks et Dependabot).
- `deploy.yml` : sur `main` (et à la main) — les mêmes contrôles, puis `wrangler deploy` par l'action officielle.
- `preview-cleanup.yml` : supprime la Preview à la fermeture de la PR.
- Secrets du dépôt : `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) et `CLOUDFLARE_ACCOUNT_ID`.
