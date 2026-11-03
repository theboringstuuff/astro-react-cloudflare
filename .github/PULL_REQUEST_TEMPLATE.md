## What and why

<!-- What this pull request changes, and the reason. Link the issue: Closes #… -->

## Type of change

- [ ] Content (copy, images, translations)
- [ ] Design (tokens, components, layout, motion)
- [ ] Feature (new page or behaviour)
- [ ] Fix
- [ ] Tooling, CI or documentation

## How it was checked

<!-- Commands run and what they returned; pages and widths looked at. -->

- [ ] `pnpm run verify` passes (tokens, design lint, i18n, `astro check` with 0 errors/warnings/hints, build, agent files, performance budget)
- [ ] Looked at in a browser at 390, 768, 1024 and 1440 px, no horizontal overflow
- [ ] Keyboard and `prefers-reduced-motion` checked on the changed parts

## Checklist

- [ ] Colours, type and spacing come from `DESIGN.md`; any new token was added there first, with its contrast measured
- [ ] Every new text exists in every language (`src/locales/<lang>/`)
- [ ] No new JavaScript, island, font or third-party request without a reason written here (budget: `scripts/check-perf-budget.mjs`)
- [ ] Lighthouse job green (performance ≥ 0.95, accessibility 1)
- [ ] No deploy from a local machine: the site goes live through the Deploy workflow only

## Screenshots

<!-- Before / after, phone and desktop, for any visible change. -->
