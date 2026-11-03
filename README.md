# Astro · React · Cloudflare — template

Le point de départ des sites de **The Boring Stuff** : statique, multilingue, rapide, lisible par les humains et par
les agents IA, déployé sur Cloudflare Workers par GitHub Actions uniquement.

- [Astro 7](https://astro.build) pré-rend chaque page en HTML ; [React 19](https://react.dev) écrit les vues, rendues
  au build : **0 kB de JavaScript envoyé par défaut**.
- [Tailwind CSS v4](https://tailwindcss.com), branché sur les tokens de `DESIGN.md` (seules ses couleurs existent).
- Multilingue avec [i18next](https://www.i18next.com) : une route par langue, textes typés, hreflang, sitemap et
  `llms.txt` par langue. Français à la racine, anglais sous `/en/`.
- [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) + assets statiques, Preview par pull
  request, Markdown servi aux agents (`Accept: text/markdown`).
- Budgets de performance vérifiés à chaque build, Lighthouse en CI : performance, accessibilité et bonnes pratiques à
  100 sur les pages du template (SEO 92 : Lighthouse ne connaît pas les lignes `Content-Signal` de `robots.txt`).

## ⚠️ Avant tout projet : mettre à jour `DESIGN.md`

`DESIGN.md` (spec [Google DESIGN.md](https://github.com/google-labs-code/design.md)) est **la source de vérité du
design**. Celui du template, « Signal », est un brouillon volontairement minimaliste : il sert à démarrer, pas à
livrer. **Avant la première ligne de code d'un nouveau projet** :

1. Réécris `DESIGN.md` : nom, palette (contrastes mesurés), typographie, formes, composants, interdits. Les skills
   recommandés ci-dessous savent le faire avec toi (`/impeccable document`, Taste Skill, Hallmark).
2. Recopie les tokens dans `src/styles/global.css` (`:root` et `@theme`) et la table `MAP` de
   `scripts/check-design-tokens.mjs`.
3. `pnpm check:tokens && pnpm lint:design` : les deux doivent passer.

Un agent qui trouve encore « Ce fichier est un brouillon » dans `DESIGN.md` doit s'arrêter et demander (voir
`AGENTS.md`).

## Skills recommandés

À installer dans le projet avant le travail de design. Ils lisent `DESIGN.md` et le respectent.

| Skill | Pour | Installation |
| --- | --- | --- |
| [Taste Skill](https://www.tasteskill.dev/) | des interfaces qui ne ressemblent pas à un gabarit d'IA | `npx skills add Leonxlnx/taste-skill` |
| [Impeccable](https://impeccable.style/) | vocabulaire de design, audit, polish, écriture de `DESIGN.md` | `npx impeccable install` |
| [Hallmark](https://www.usehallmark.com/) | composition de pages, thèmes, auto-relecture dans le navigateur | `npx skills add nutlope/hallmark` |

## Démarrer

Crée le dépôt depuis ce template (**Use this template** sur GitHub, ou
`gh repo create theboringstuuff/<nom> --template theboringstuuff/astro-react-cloudflare --private --clone`), puis :

```sh
nvm use           # Node 24 (.nvmrc ; Astro demande au moins 22.23)
corepack enable   # pnpm, à la version de packageManager (pas de npm ici)
pnpm install
pnpm dev          # http://localhost:4321
pnpm verify       # tout ce que la CI vérifie, dans le même ordre
pnpm preview      # build + le vrai Worker en local (wrangler dev)
pnpm lighthouse   # Lighthouse CI sur le build (Chrome requis)
```

### Checklist d'un nouveau projet

- [ ] `DESIGN.md` réécrit, tokens recopiés, `check:tokens` et `lint:design` verts
- [ ] `SITE_URL` dans `src/i18n/config.ts` (canonical, hreflang, sitemap, robots, llms.txt)
- [ ] `name` dans `wrangler.jsonc` et `package.json`
- [ ] Les langues dans `LOCALES` et `DEFAULT_LANG` (`src/i18n/config.ts`), un dossier `src/locales/<code>/` par langue
- [ ] `meta.brand`, `meta.title`, `meta.description` dans chaque `common.json`
- [ ] `SITE` et `NAV` dans `src/data/site.ts`, `CODEOWNERS`
- [ ] La politique IA de `src/pages/robots.txt.ts` (`ai-train=no` par défaut)
- [ ] Secrets du dépôt : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` ; environnements `production` et `preview`
- [ ] Les pages et textes de démonstration remplacés

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | serveur de développement |
| `pnpm build` | construit le site dans `dist/client/` |
| `pnpm preview` | build + `wrangler dev` (le Worker réel, négociation Markdown comprise) |
| `pnpm verify` | la définition de « fini » : tokens, lint design, CSS, i18n, `astro check`, build, fichiers agents, budget perf |
| `pnpm i18n:check` | toutes les langues ont les mêmes textes que la langue de référence (`--same` liste les identiques) |
| `pnpm check:perf` | budget par page (Brotli) : HTML, JS, polices, images, aucun tiers, aucun îlot non déclaré |
| `pnpm lighthouse` | Lighthouse CI, profil mobile, médiane de 5 passages |

Il n'y a **pas** de commande de déploiement : la mise en ligne passe uniquement par GitHub Actions (merge sur `main`).

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) : comment une page est construite, les langues, la performance, le Worker,
  quand et comment ajouter du JavaScript ou une route serveur.
- [`DESIGN.md`](./DESIGN.md) : les tokens et les règles visuelles (à réécrire, voir plus haut).
- [`AGENTS.md`](./AGENTS.md) : les règles pour les agents de code (Claude Code, Codex, OpenCode… ; `CLAUDE.md` y
  renvoie).

## Licences

Code du template : le vôtre. Bricolage Grotesque : SIL Open Font License. `@gutenye/astro-i18next` : Elastic
License 2.0 (source disponible).
