# AGENTS.md

Instructions for coding agents working in this repository. Humans: read `README.md` first.

## Before anything else

- **`DESIGN.md` is the source of truth for the design** (Google DESIGN.md spec). If the project has not rewritten it
  yet (its Overview still says « Ce fichier est un brouillon »), stop and ask for the brand, or run the design skills
  below to write it, **before** building any component. `src/styles/global.css` only copies its tokens; change
  `DESIGN.md` first, then the CSS. `pnpm check:tokens` fails when they drift.
- **`ARCHITECTURE.md`** explains how a page is built, where each thing lives and why. Read it before adding a page,
  a language, an island or a server route.

## Project rules

- **Deployment goes through GitHub Actions only** (`.github/workflows/deploy.yml`, on push to `main`; Previews per
  pull request from `ci.yml`). Never add a `deploy`/`publish` script to `package.json`, never run `wrangler deploy`,
  `wrangler pages deploy` or `wrangler preview` from a machine.
- **Definition of done: `pnpm verify`** (tokens, `design.md lint`, single stylesheet, i18n, `astro check` with 0
  errors/warnings/hints, build, agent files, performance budget). The CI runs the same steps, plus Lighthouse.
- **Zero JavaScript by default.** React components render to HTML at build time, without `client:*`. Behaviour is
  plain TypeScript in `src/scripts/`, inlined by Astro when small. An island (`client:visible`, never `client:load`
  below the fold) needs a reason in the pull request and an entry in `ISLANDS` of `scripts/check-perf-budget.mjs`.
- **Performance budget** (`scripts/check-perf-budget.mjs`): raise a number only on purpose, in the same pull request
  as the reason. No third-party script, font, image or frame. Images go through `astro:assets`
  (`src/components/ui/Img.tsx`, `Picture.tsx`) with width, height and alt. The LCP element is never animated in.
- **Every text is in `src/locales/<lang>/<namespace>.json`**, in every language, same keys, same placeholders, same
  HTML tags (`pnpm i18n:check`). The default language (`DEFAULT_LANG` in `src/i18n/config.ts`) is the reference and
  types `t()`. Links go through `href(lang, '/path')`, never a bare `/path`. Never use the global `t` from `i18next`.
- **Styling**: Tailwind utilities in the `.tsx`; `src/styles/global.css` is the only stylesheet (`pnpm check:css`).
  Only DESIGN.md colours exist as utilities. Logical properties (`ms-*`, `ps-*`, `start-*`) so RTL works.
- **Structure**: components by role in `src/components/{layout,home,ui}`; page content in `src/views/`; routes in
  `src/pages/[...lang]/`; non-text facts in `src/data/`; browser scripts in `src/scripts/`. Import with the `@/` alias.
- **Never invent content**: no testimonials, logos, figures or claims without a source the user named.
- Pull requests use `.github/PULL_REQUEST_TEMPLATE.md`. Never commit secrets (`.env`, `.dev.vars`).

## Recommended skills

Install them in the project before design work; they read `DESIGN.md` and respect it.

- **Taste Skill** — https://www.tasteskill.dev/ (`npx skills add Leonxlnx/taste-skill`)
- **Impeccable** — https://impeccable.style/ (`npx impeccable install`; `/impeccable document` writes `DESIGN.md`)
- **Hallmark** — https://www.usehallmark.com/ (`npx skills add nutlope/hallmark`)

## Development

Start the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status` and `astro dev logs`. `pnpm preview` builds and serves the real
Worker (`wrangler dev`) with the Markdown negotiation of `src/worker.ts`.

## Documentation

- Astro: https://docs.astro.build — [routing](https://docs.astro.build/en/guides/routing/),
  [framework components](https://docs.astro.build/en/guides/framework-components/),
  [styling](https://docs.astro.build/en/guides/styling/),
  [i18n](https://docs.astro.build/en/guides/internationalization/),
  [Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- Cloudflare Workers static assets: https://developers.cloudflare.com/workers/static-assets/
- DESIGN.md spec: https://github.com/google-labs-code/design.md
