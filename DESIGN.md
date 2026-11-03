---
version: alpha
name: Signal
description: >-
  Le point de départ, pas la destination. Un papier, une encre, un signal :
  une seule famille de caractères, deux rayons, aucune ombre. À réécrire
  pour chaque projet avant la première ligne de code.
colors:
  primary: "#16140F"
  neutral: "#F3F0E8"
  secondary: "#5C574C"
  tertiary: "#FF4A1C"
  line: "#D6CFBF"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 7rem
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.045em"
  headline:
    fontFamily: Bricolage Grotesque
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: Bricolage Grotesque
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: ui-monospace
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.08em
rounded:
  none: 0px
  full: 999px
spacing:
  "1": 0.25rem
  "2": 0.5rem
  "4": 1rem
  "8": 2rem
  "16": 4rem
  "32": 8rem
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  text-quiet:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    padding: 0 1.5rem
    height: 3rem
  button-primary-hover:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  signal-chip:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    typography: "{typography.label}"
    padding: 0.25rem 0.75rem
  signal-on-ink:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
  rule:
    backgroundColor: "{colors.line}"
    height: 1px
---

## Overview

> **Ce fichier est un brouillon.** Avant le premier composant d'un nouveau projet, réécris-le : marque, palette,
> typographie, et ce que le site ne fera jamais. `DESIGN.md` est la source de vérité ; `src/styles/global.css` ne fait
> que le recopier (`pnpm check:tokens` échoue quand les deux divergent). Change ce fichier d'abord, le CSS ensuite.

**Signal** est une direction volontairement nue : la page est du papier, le texte est de l'encre, et une seule couleur,
le signal, dit « ici ». Tout le caractère vient de la typographie : une grotesque variable très serrée, poussée à 800
pour les titres, posée à 400 pour le texte, et un mono discret pour les étiquettes. Le reste est du vide.

Trois mots : **net, chaleureux, insolent**. Le site doit se lire comme une affiche bien composée, pas comme un gabarit.

Le performance budget est une règle de design : une seule famille (le seul axe `wght`, ~41 kB, sous-ensemble latin),
aucune image décorative, zéro JavaScript par défaut. Une idée qui coûte du poids doit le mériter.

## Colors

Cinq couleurs, et c'est déjà beaucoup.

| Token       | Valeur    | Variable CSS | Rôle                                                                 |
| ----------- | --------- | ------------ | -------------------------------------------------------------------- |
| `primary`   | `#16140F` | `--ink`      | L'encre : texte, boutons pleins, surfaces sombres.                   |
| `neutral`   | `#F3F0E8` | `--paper`    | Le papier : le fond de toutes les pages. Jamais de blanc pur.        |
| `secondary` | `#5C574C` | `--muted`    | Le texte secondaire (6,3:1 sur le papier).                           |
| `tertiary`  | `#FF4A1C` | `--signal`   | Le signal : un aplat, un point, une sélection. **Jamais du texte sur le papier** (2,95:1). |
| `line`      | `#D6CFBF` | `--line`     | Les filets de 1 px. Décoratif uniquement, ne porte aucune information. |

Contrastes mesurés (WCAG) : encre/papier 16,2:1 · muted/papier 6,3:1 · encre/signal 5,5:1 · signal/encre 5,5:1.
Le signal se lit **sur l'encre** ou **sous l'encre**, jamais seul sur le papier.

## Typography

- **Bricolage Grotesque** (variable, OFL, auto-hébergée via `@fontsource-variable`) pour tout : titres et texte.
  Seul l'axe `wght` est chargé ; le fichier latin est préchargé, le latin-ext (œ, ł…) ne se télécharge que si la page
  en contient.
- `display` : 800, interlignage 0,9, approche −0,045 em. Taille fluide `clamp(3.25rem, 1rem + 9vw, 7rem)`
  (`--step-display`).
- `headline` : 700, approche −0,03 em, `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)` (`--step-headline`).
- `body` : 400, 1,125 rem, interlignage 1,55, 65 caractères de large au plus.
- `label` : la monospace du système, en capitales, approche 0,08 em. Pour les métadonnées, jamais pour une phrase.
- Les titres ne sont jamais en capitales ; c'est le poids qui hiérarchise, pas la casse.

## Layout

- Une colonne de lecture (`max-width: 65ch`) dans une grille de page à gouttières fluides (`--gutter`).
- Espacement en puissances de deux : 4, 8, 16, 32, 64, 128 px. Rien entre les deux.
- Les sections respirent : `spacing.32` entre deux sections sur grand écran, `spacing.16` sur mobile.
- Mobile d'abord ; un seul point de rupture principal, `md` (48rem).

## Elevation & Depth

Aucune. Pas d'ombre, pas de flou, pas de dégradé. La profondeur vient de l'inversion : une section en encre sur le
papier, c'est tout le relief dont le site a besoin.

## Shapes

Deux rayons : `none` (0) pour tout ce qui est surface ou image, `full` (999 px) pour ce qui se clique ou se signale
(boutons, pastilles, le point de navigation). Rien d'intermédiaire.

**Le point** est la signature : un disque de signal de 0,5 rem qui marque la page courante dans le menu, la langue
active, et le curseur de sélection de texte (`::selection` en signal, texte en encre).

## Components

| Composant              | Rôle                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| `page`                 | Le fond et le texte de chaque page.                                      |
| `text-quiet`           | Étiquettes et métadonnées en mono (`muted` sur le papier).               |
| `button-primary`       | La seule action principale d'un écran : pilule d'encre, 48 px de haut.   |
| `button-primary-hover` | Au survol et au focus, l'encre cède au signal.                           |
| `signal-chip`          | Une pastille de signal (nouveauté, statut). Une par écran au plus.       |
| `signal-on-ink`        | Le signal en texte, uniquement sur une surface d'encre.                  |
| `rule`                 | Filet de 1 px entre deux blocs.                                          |

Tous les composants sont rendus en HTML au build (React sans `client:*`) : aucun ne charge de JavaScript.

## Do's and Don'ts

- **Do** : un seul signal visible par écran. S'il y en a deux, l'un des deux est de trop.
- **Do** : laisser le vide travailler ; supprimer une section avant d'en ajouter une.
- **Do** : animer peu, en CSS d'abord (`[data-reveal]`, transitions de page) ; du JavaScript seulement via
  `src/scripts/motion.ts` (voir ARCHITECTURE.md) ; rien pour `prefers-reduced-motion`.
- **Don't** : ombres, dégradés, glassmorphism, emoji en guise d'icônes, cartes empilées en grille de trois.
- **Don't** : signal en texte sur le papier, ou n'importe quelle couleur hors de ce fichier (`bg-red-500` ne compile pas).
- **Don't** : ajouter une police, un poids hors de 400/500/700/800, ou une image de décoration sans budget.
