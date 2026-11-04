# ARCHITECTURE.md: Mabinogis Portfolio

Single source of truth for the build. Follow it literally. If something is missing, write `QUESTION:` and stop. Do not invent files, props, dependencies or colours.

**Project:** static portfolio site for **Mabinogis**, the studio of Marko Đuranović, M.A. (Zagreb / Remote). Pillars: map design, GIS analysis, geospatial database analysis, geospatial database creation and management. Tagline (exact): **"Maps are cool."** Tone: simple, fun, confident.

## 0. Conventions

- **Astro `^5`** (pinned on purpose; do not upgrade). TypeScript strict. Static output. No UI frameworks, no Tailwind, no React syntax.
- Import alias: `@/*` maps to `src/*`. Always import with the alias (`@/components/Logo.astro`), never with `../../`. Exception: image paths inside markdown frontmatter must be relative.
- Naming: components PascalCase `.astro`; CSS classes lowercase with BEM (`.hero__bg`, `.card--tilt`); data files lowercase `.ts`.
- Routes have no trailing slash (`/portfolio/portfolio-1`).
- Colours only via CSS variables from `tokens.css`. Never hardcode a hex value in a component.
- Decorative elements get `aria-hidden="true"`. `--taupe` is decorative only, never for text.
- Breakpoint: `900px`. Desktop is `min-width: 900px`; mobile is `max-width: 899px`. (CSS variables cannot be used in media queries, so hardcode it.)
- Component style: `interface Props {}` then `const { a, b = "default" } = Astro.props;`. Scoped `<style>` in each component. No inline colours.
- Supplied assets, never regenerate: `src/components/Logo.astro`, `src/assets/backgrounds/bg-1-blur.webp`, `src/assets/backgrounds/bg-1-original.webp`, `src/assets/portfolio/portfolio_1.png` to `portfolio_5.png` (underscore names, PNG).

---

## 1. Final file tree

```
ARCHITECTURE.md
astro.config.mjs               site URL + static output
package.json                   astro ^5, @fontsource/* x3
tsconfig.json                  extends astro/tsconfigs/strict, adds @/* alias
README.md                      run + Cloudflare Pages deploy notes
public/
  favicon.svg                  simple vermilion compass-needle icon
  robots.txt                   allow all
src/
  content.config.ts            collections: portfolio, blog (zod + image())
  data/
    site.ts                    name, url, tagline, email, socials, nav
    services.ts                4 pillar entries
  content/
    portfolio/portfolio-1.md   sample entry (one per supplied image)
    portfolio/portfolio-2.md
    portfolio/portfolio-3.md
    portfolio/portfolio-4.md
    portfolio/portfolio-5.md
    blog/hello-maps.md         sample post
    blog/why-geodatabases.md   sample post
    blog/map-design-basics.md  sample post
  assets/
    backgrounds/bg-1-blur.webp [SUPPLIED] pre-blurred hero background
    backgrounds/bg-1-original.webp [SUPPLIED] unblurred hero background (sharp at the edges)
    portfolio/portfolio_1.png  [SUPPLIED] (portfolio_1.png to portfolio_5.png)
  styles/
    tokens.css                 design tokens only
    global.css                 reset, base type, utilities, focus, reduced motion
  components/
    Logo.astro                 [SUPPLIED] black box, import and place only
    BaseLayout.astro           <html> shell: head, fonts, sidebar, mobile bar, footer
    Sidebar.astro              desktop fixed left panel
    MobileBar.astro            mobile top bar + toggle drawer (vanilla JS)
    NavItem.astro              one nav link with coordinate label
    Footer.astro               cartouche, scale bar, socials, copyright
    EmailLink.astro            email assembled in the browser so scrapers cannot read it
    PhoneLink.astro            phone assembled in the browser so scrapers cannot read it
    Hero.astro                 full-screen landing hero
    SectionHeader.astro        vermilion tag + title + optional lead
    PillarCard.astro           one service card
    ProjectCard.astro          one portfolio card
    PostCard.astro             one blog card
    TagFilter.astro            tag buttons + vanilla filter script
    CTABand.astro              call-to-action band
    ContactRow.astro           label + value row
    ContactForm.astro          static form for Formspree
    Graticule.astro            neatline tick marks on a card border
    CompassRose.astro          small decorative compass (not the logo)
    ScaleBar.astro             map scale bar
    Cartouche.astro            chart title block
    SoundingsBackground.astro  faint scattered depth numbers
    RhumbDivider.astro         crossing-lines section divider
    Stamp.astro                rotated stamp badge
  pages/
    index.astro                landing
    dev.astro                  TEMP test page for stage 2 (deleted in stage 8)
    portfolio/index.astro      filterable grid
    portfolio/[slug].astro     project detail
    blog/index.astro           post list
    blog/[slug].astro          post page
    contact.astro              contact page
    404.astro                  "Off the map" page
```

---

## 2. Component table

| Component | Props (typed) | Slots | Renders (children) | Used by |
|---|---|---|---|---|
| Logo | `size?: string`, `animate?: boolean` | none | none | Sidebar, MobileBar, Hero |
| BaseLayout | `title: string`, `description?: string` | default | Sidebar, MobileBar, Footer | every page |
| Sidebar | `currentPath: string` | none | Logo, NavItem, CompassRose | BaseLayout |
| MobileBar | `currentPath: string` | none | Logo, NavItem | BaseLayout |
| NavItem | `label: string`, `href: string`, `coord: string`, `active: boolean` | none | none | Sidebar, MobileBar |
| Footer | none | none | Cartouche, ScaleBar, CompassRose, EmailLink | BaseLayout |
| EmailLink | none (reads `@/data/site`) | none | none | Footer, contact |
| PhoneLink | none (reads `@/data/site`) | none | none | contact |
| Hero | none | none | Logo, Stamp, Graticule, Image (bg) | index |
| SectionHeader | `tag: string`, `title: string`, `lead?: string`, `align?: "left" or "center"` | none | none | all pages |
| PillarCard | `service: Service` (type from `@/data/services`) | none | Graticule | index |
| ProjectCard | `title: string`, `summary: string`, `cover: ImageMetadata`, `tags: string[]`, `year: number`, `href: string` | none | Image, Stamp, Graticule | index, portfolio/index |
| PostCard | `title: string`, `description: string`, `pubDate: Date`, `tags: string[]`, `href: string` | none | none | index, blog/index |
| TagFilter | `tags: string[]`, `targetId: string` | none | none | portfolio/index |
| CTABand | `heading: string`, `text: string`, `label: string`, `href: string` | none | SoundingsBackground | index, contact |
| ContactRow | `label: string`, `value?: string`, `href?: string`, `external?: boolean` | default (replaces the value and link, used for EmailLink and PhoneLink) | none | contact |
| ContactForm | `action: string` | none | none | contact |
| Graticule | `edges?: ("top" or "right" or "bottom" or "left")[]` (default all), `step?: number` (px, default 12) | none | none | PillarCard, ProjectCard, Hero |
| CompassRose | `size?: string` (default `"64px"`) | none | none | Sidebar, Footer, 404 |
| ScaleBar | `label?: string` (default `"0 · 25 · 50 km"`) | none | none | Footer |
| Cartouche | none (reads `@/data/site`) | none | none | Footer |
| SoundingsBackground | `count?: number` (default 36), `seed?: number` (default 7) | none | none | CTABand, index pillars section, 404 |
| RhumbDivider | `flip?: boolean` | none | none | index, contact |
| Stamp | `text: string`, `tone?: "vermilion" or "ink"`, `tilt?: number` (deg, default -6) | none | none | Hero, ProjectCard, portfolio/[slug] |

### Behaviour notes (read before building each component)

- **BaseLayout:** `<head>` starts with `<meta charset="utf-8">`, then viewport, `<title>{title} | Mabinogis</title>` (home page passes the full title), description, canonical (`new URL(Astro.url.pathname, Astro.site)`), favicon link, Open Graph title/description. Imports `@/styles/tokens.css`, `@/styles/global.css` and the fonts (see §8). Body order: skip link, `<Sidebar/>`, `<MobileBar/>`, `<div class="site-shell"><main id="main"><slot/></main><Footer/></div>`. `currentPath` = `Astro.url.pathname`.
- **Active nav:** `active = href === "/" ? path === "/" : path.startsWith(href)`.
- **Sidebar:** `<aside>`; `position: fixed; inset: 0 auto 0 0; width: var(--sidebar-w)`; background `var(--card)`; right border `1px solid var(--line)`; hidden below 900px. Top: Logo (`size="110px"`, `animate={false}`) wrapped in a link to `/` with `aria-label="Mabinogis home"`; name in `--font-head`. Middle: `<nav aria-label="Main">` list of NavItem from `nav.filter(n => n.enabled)`. Bottom: socials as links, coordinate line (`site.coord`, mono), small CompassRose.
- **NavItem:** a link with a mono coordinate span (colour `--ink-soft`, not taupe, for readable contrast) and the label in `--font-head`. Active: vermilion left bar, `aria-current="page"`.
- **MobileBar:** `<header>`; fixed top, height 56px, frosted background, bottom border; hidden at 900px and above. Left: small Logo (`size="36px"`, `animate={false}`) + name. Right: `<button aria-expanded="false" aria-controls="mobile-drawer">Menu</button>`. Drawer: `<nav id="mobile-drawer" hidden>` with NavItems. Vanilla `<script>`: button click toggles the `hidden` attribute on the drawer and `aria-expanded`; Escape and any link click close it.
- **Hero:** `<section class="hero">`, `min-height: 100svh` (on mobile `calc(100svh - 56px)`), `position: relative; overflow: hidden`, NOT fixed. Layers, bottom to top: (1) `<div class="hero__bg">` (absolutely positioned `inset: 0`, `opacity: var(--hero-bg-opacity)`, `transform: scale(1.08)`) holding TWO images: the sharp `bg-1-original.webp` `<Image>`, then a `<div class="hero__blur">` holding the `bg-1-blur.webp` `<Image>`. `.hero__blur` is absolutely positioned and masked with `mask-image` (and `-webkit-mask-image`) `radial-gradient(ellipse at center, #000 var(--blur-full-until), transparent var(--blur-gone-at))`, so the map is blurred in the centre and sharp at the edges. Tuning variables on `.hero`: `--blur-full-until: 20%`, `--blur-gone-at: 70%`, `--glow-opacity: 0.59`. Style images with `.hero__bg :global(img) { width: 100%; height: 100%; object-fit: cover; }`. (2) `.hero__vignette`: a bottom fade into `var(--paper)` plus a light radial edge fade (`color-mix(in srgb, var(--paper) 45%, transparent)`) so the sharp edges stay visible. (3) Content, centred with grid: a `.hero__logo` wrapper around `<Logo size="min(26vh, 230px)" />` with a soft glow made by a `::before` pseudo-element (`inset: -45%`, `radial-gradient(circle closest-side, var(--card) 0%, var(--card) 40%, transparent 100%)`, `opacity: var(--glow-opacity)`); `<h1>Mabinogis</h1>`; a `.card.card--frost` with the tagline "Maps are cool." and a mono line "Map design · GIS analysis · Geospatial databases", `<Graticule />` inside that card, and a `<Stamp text="Open for projects" />` (wrapped in a positioned span) at the card's corner; then a scroll cue (`<a href="#pillars">` with a down arrow). The next section sits on `var(--paper)`, so scrolling reveals a plain cream page. No JavaScript is needed.
- **Graticule:** CSS only. Absolutely positioned inside a `position: relative` parent; one thin element per edge using `repeating-linear-gradient` ticks in `var(--taupe)`; `pointer-events: none`.
- **SoundingsBackground:** absolutely positioned layer, `pointer-events: none`, `opacity: .18`. Generates `count` small mono numbers (1 to 99) at deterministic positions from a simple LCG seeded with `seed` (no `Math.random`). Parent must be `position: relative; overflow: hidden`.
- **Stamp:** inline-block, mono uppercase, double border (`outline` plus `border`), `transform: rotate(var(--tilt))`.
- **Cartouche:** bordered box (double rule), rows: name, owner, coord, "Sheet 1 of 1", and `new Date().getFullYear()`.
- **TagFilter:** buttons with `data-filter` ("all" plus each tag). Vanilla `<script>`: on click, set `aria-pressed`, and for each child of `#targetId` that has `data-tags`, toggle the `hidden` attribute (show when filter is "all" or the comma-separated `data-tags` contains it). Without JavaScript everything stays visible.
- **ProjectCard:** root `<article class="card card--tilt" data-tags={tags.join(",")}>`; the whole card is a link to `href`.
- **PillarCard icons:** map `service.icon` to an inline 24x24 stroke SVG (keys: `map`, `analysis`, `database`, `cog`). Keep each icon under 6 shapes.
- **ContactForm:** `<form method="POST" action={action}>`; fields `name`, `email` (type email), `message` (textarea), all with `<label for>`; a hidden honeypot `<input name="_gotcha" tabindex="-1" autocomplete="off">`; submit uses `.btn`.

---

## 3. Design tokens and global CSS

### `src/styles/tokens.css` (complete)

```css
:root {
  /* colour */
  --paper: #F5F0E8;
  --card: #FAF7F2;
  --cream-deep: #E5DFD1;
  --taupe: #AA9585;
  --ink: #27201A;
  --ink-soft: #55483F;
  --vermilion: #BF4C2C;
  --line: rgba(170, 149, 133, 0.45);
  --card-frost: rgba(250, 247, 242, 0.88);
  --shadow-card: 0 12px 32px rgba(39, 32, 26, 0.12), 0 2px 6px rgba(39, 32, 26, 0.06);

  /* type */
  --font-head: "Baskervville", "Baskerville Old Face", Georgia, serif;
  --font-body: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
  --fs-0: 0.8125rem;
  --fs-1: 1rem;
  --fs-2: 1.125rem;
  --fs-3: clamp(1.4rem, 2.2vw, 1.75rem);
  --fs-4: clamp(1.8rem, 3.2vw, 2.6rem);
  --fs-5: clamp(2.6rem, 6vw, 4.5rem);

  /* space */
  --sp-1: 0.25rem;
  --sp-2: 0.5rem;
  --sp-3: 1rem;
  --sp-4: 1.5rem;
  --sp-5: 2.5rem;
  --sp-6: 4rem;

  /* shape and layout */
  --radius: 18px;
  --radius-sm: 10px;
  --sidebar-w: 260px;
  --content-max: 1100px;
  --hero-bg-opacity: 0.75;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

### `src/styles/global.css` (complete)

```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }

body {
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--font-body); font-size: var(--fs-1); line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { font-family: var(--font-head); font-weight: 400; line-height: 1.15; margin: 0 0 0.5em; color: var(--ink); }
h1 { font-size: var(--fs-5); } h2 { font-size: var(--fs-4); } h3 { font-size: var(--fs-3); }
p { margin: 0 0 1em; }
a { color: var(--vermilion); text-underline-offset: 0.2em; }
a:hover { text-decoration-thickness: 2px; }
img, svg { max-width: 100%; display: block; }
ul { margin: 0; padding: 0; list-style: none; }
::selection { background: var(--vermilion); color: var(--card); }
:focus-visible { outline: 3px solid var(--vermilion); outline-offset: 3px; border-radius: 4px; }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip-link { position: absolute; left: -999px; top: 0; }
.skip-link:focus { left: 1rem; top: 1rem; z-index: 100; background: var(--card); padding: 0.5rem 1rem; border-radius: var(--radius-sm); }

.container { width: min(100% - 2rem, var(--content-max)); margin-inline: auto; }
.section { position: relative; padding-block: clamp(3rem, 8vw, 6rem); }
.grid { display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

.card {
  position: relative; background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow-card);
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}
.card--tilt:hover { transform: rotate(-0.8deg) translateY(-4px); }
.card--frost { background: var(--card-frost); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

.mono-label { font-family: var(--font-mono); font-size: var(--fs-0); letter-spacing: 0.22em; text-transform: uppercase; color: var(--vermilion); }
.chip { display: inline-block; font-family: var(--font-mono); font-size: var(--fs-0); padding: 0.15rem 0.6rem; border: 1px solid var(--line); border-radius: 999px; background: var(--cream-deep); color: var(--ink-soft); }
.btn {
  display: inline-block; font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.8rem 1.4rem; border-radius: 999px; border: 2px solid var(--ink); background: var(--ink); color: var(--card);
  text-decoration: none; cursor: pointer; transition: background 0.2s var(--ease), border-color 0.2s var(--ease);
}
.btn:hover { background: var(--vermilion); border-color: var(--vermilion); }
.btn--ghost { background: transparent; color: var(--ink); }
.btn--ghost:hover { color: var(--card); }

@media (min-width: 900px) { .site-shell { padding-left: var(--sidebar-w); } }
@media (max-width: 899px) { .site-shell { padding-top: 56px; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .card--tilt:hover { transform: none; }
}
```

---

## 4. Data, zod schemas and content config

### `astro.config.mjs`

```js
import { defineConfig } from "astro/config";
export default defineConfig({ site: "https://www.mabinogis.com", output: "static" });
```

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } }
}
```

### `src/content.config.ts` (complete)

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/portfolio" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      cover: image(),
      tags: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
      year: z.number().int(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { portfolio, blog };
```

### `src/data/site.ts` (exact values)

```ts
export interface NavEntry { label: string; href: string; coord: string; enabled: boolean; }
export interface Social { label: string; href: string; }

export const site = {
  name: "Mabinogis",
  owner: "Marko Đuranović, M.A.",
  url: "https://www.mabinogis.com",
  tagline: "Maps are cool.",
  email: "marko@mabinogis.com",
  phone: "+49 179 538 7888",
  location: "Zagreb / Remote",
  coord: "45°48′N 15°58′E",
  availability: "Open for new projects. I usually reply within a couple of working days.",
  formAction: "https://formspree.io/f/YOUR_ID",
  socials: [
    { label: "ArtStation", href: "https://www.artstation.com/forcoforce" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/marko-%C4%91uranovi%C4%87-a145961a5/" },
  ] as Social[],
};

export const nav: NavEntry[] = [
  { label: "Home",      href: "/",          coord: "45°48′N", enabled: true },
  { label: "Portfolio", href: "/portfolio", coord: "15°58′E", enabled: true },
  { label: "Blog",      href: "/blog",      coord: "45°49′N", enabled: true },
  { label: "Contact",   href: "/contact",   coord: "15°59′E", enabled: true },
  // reserved for future expansion (enabled: false = hidden from nav)
  { label: "Services",  href: "/services",  coord: "45°50′N", enabled: false },
  { label: "About",     href: "/about",     coord: "16°00′E", enabled: false },
  { label: "Shop",      href: "/shop",      coord: "45°47′N", enabled: false },
  { label: "RSS",       href: "/rss.xml",   coord: "15°57′E", enabled: false },
];
```

### `src/data/services.ts` (complete)

```ts
export interface Service {
  id: string; title: string; blurb: string;
  icon: "map" | "analysis" | "database" | "cog";
  coord: string;
}

export const services: Service[] = [
  { id: "map-design", title: "Map Design", icon: "map", coord: "01 · MAP DESIGN",
    blurb: "Clear, good-looking maps that tell the story at a glance." },
  { id: "gis-analysis", title: "GIS Analysis", icon: "analysis", coord: "02 · GIS ANALYSIS",
    blurb: "Turning spatial data into answers: patterns, proximity and change over time." },
  { id: "geodb-analysis", title: "Geospatial Database Analysis", icon: "database", coord: "03 · DATABASE ANALYSIS",
    blurb: "Auditing, querying and untangling the spatial databases you already have." },
  { id: "geodb-management", title: "Database Creation & Management", icon: "cog", coord: "04 · DATABASE BUILD",
    blurb: "Designing, building and maintaining geospatial databases that stay tidy." },
];
```

### Sample content

`src/content/portfolio/portfolio-1.md` (one file per supplied image, 5 in total: `portfolio-N.md` references `../../assets/portfolio/portfolio_N.png`; note the hyphen in the markdown filename and the underscore in the image filename):

```md
---
title: "Placeholder Project One"
summary: "A short, fun one-line description of this map project."
cover: "../../assets/portfolio/portfolio_1.png"
tags: ["Map design"]
tools: ["QGIS", "Inkscape"]
year: 2026
featured: true
draft: false
---
Project write-up goes here. Replace with the real story.
```

`portfolio-2.md`: title "Placeholder Project Two", tags `["GIS analysis"]`, tools `["QGIS", "PostGIS"]`, `featured: true`.
`portfolio-3.md`: title "Placeholder Project Three", tags `["Geospatial databases"]`, tools `["PostGIS", "Python"]`, `featured: true`.
`portfolio-4.md`: title "Placeholder Project Four", tags `["Map design"]`, tools `["QGIS", "Inkscape"]`, `featured: false`.
`portfolio-5.md`: title "Placeholder Project Five", tags `["GIS analysis"]`, tools `["QGIS", "PostGIS"]`, `featured: false`.

`src/content/blog/hello-maps.md`:

```md
---
title: "Hello, maps"
description: "Why this studio exists and what you will find here."
pubDate: 2026-11-02
tags: ["Studio"]
draft: false
---
A short welcome post. Maps are cool, and this is where the more interesting projects will live.
```

`why-geodatabases.md`: title "Why geodatabases matter", pubDate 2026-11-03, tags `["Geospatial databases"]`, one paragraph of body.
`map-design-basics.md`: title "Map design basics", pubDate 2026-11-04, tags `["Map design"]`, one paragraph of body.

---

## 5. Data flow

| Page | Reads | Query and use |
|---|---|---|
| all pages (via BaseLayout) | `site.ts` | `nav` (enabled only), `site.socials`, `site.coord`, `site.name` |
| `/` | `services.ts`, portfolio, blog | all `services` to PillarCard. Portfolio: not draft, `featured` first, sort by `year` descending, take 3. Blog: not draft, sort by `pubDate` descending, take 2. |
| `/portfolio` | portfolio | not draft, sort by `year` descending. Tag list = unique sorted tags from all entries, passed to TagFilter. Grid has `id="project-grid"`. |
| `/portfolio/[slug]` | portfolio | `getStaticPaths` over non-draft entries, `params.slug = entry.id`. Render with `render(entry)`. |
| `/blog` | blog | not draft, sort by `pubDate` descending. |
| `/blog/[slug]` | blog | same pattern as portfolio detail. |
| `/contact` | `site.ts` | email and phone (both assembled in the browser by EmailLink and PhoneLink), location, socials, availability, `formAction`. |
| `/404` | none | static. |

---

## 6. Expansion hooks

| Future feature | Where it plugs in | Exact files that change |
|---|---|---|
| New page (e.g. Services) | Flip `enabled: true` in the nav entry; add one page file | `src/data/site.ts`, new `src/pages/services.astro` |
| MapLibre interactive map | Replace the marked slot `<!-- MAPLIBRE SLOT -->` (an empty `<div id="map-slot">` placed after the pillars section on the landing page); load MapLibre in a client `<script>` inside the new island component | `package.json` (add `maplibre-gl`), new `src/components/MapIsland.astro`, `src/pages/index.astro` |
| RSS feed | `@astrojs/rss`, endpoint over the blog collection | `package.json`, new `src/pages/rss.xml.js`, `src/data/site.ts` (enable the RSS nav entry), `src/components/BaseLayout.astro` (add `<link rel="alternate">`) |
| Dark mode | Token overrides under `:root[data-theme="dark"]`; toggle button in the sidebar; tiny inline head script to read the stored choice | `src/styles/tokens.css`, `src/components/Sidebar.astro`, `src/components/BaseLayout.astro` |
| Sitemap | `@astrojs/sitemap` integration | `package.json`, `astro.config.mjs` |
| More services | Add an object to the array | `src/data/services.ts` |
| More projects or posts | Add a markdown file | `src/content/portfolio/*.md` or `src/content/blog/*.md` plus an image in `src/assets/portfolio/` |

---

## 7. Build plan

Do ONE stage per message. After each stage run `npm run dev` and check the list. Keep each stage under about 400 lines.

**Stage 1: scaffold, tokens, data, content**
Terminal commands (user runs these first, Node 20 or newer):
```
npm create astro@latest mabinogis -- --template minimal --typescript strict --no-git --yes
cd mabinogis
npm install astro@^5 @fontsource/baskervville @fontsource/source-serif-4 @fontsource/ibm-plex-mono
```
Then the user copies the supplied assets (Logo.astro, bg-1-blur.webp, bg-1-original.webp, portfolio images) into the paths in §1. Files to write: `astro.config.mjs`, `tsconfig.json`, `public/favicon.svg`, `public/robots.txt`, `src/styles/tokens.css`, `src/styles/global.css`, `src/data/site.ts`, `src/data/services.ts`, `src/content.config.ts`, the 3 portfolio and 3 blog sample files.
Check: `npm run dev` starts, the terminal shows no content-collection errors, and the default page loads.

**Stage 2: chart components + test page**
Files: `Graticule`, `CompassRose`, `ScaleBar`, `Cartouche`, `SoundingsBackground`, `RhumbDivider`, `Stamp`, and the temporary `src/pages/dev.astro`. `dev.astro` is standalone: it imports `@/styles/tokens.css` and `@/styles/global.css` directly (no layout) and shows each component once inside a cream card.
Check: open `/dev`. Ticks on a card border, a compass, scale bar, cartouche, faint numbers, a divider, a tilted stamp.

**Stage 3: layout shell**
Files: `BaseLayout`, `Sidebar`, `MobileBar`, `NavItem`, `Footer`, `EmailLink` (the footer shows the email through it), and a placeholder `src/pages/index.astro` using BaseLayout with an `<h1>`.
Check: fixed left sidebar with the logo and four nav entries on desktop; at width below 900px it becomes a top bar and the Menu button opens and closes the drawer; footer shows the cartouche and scale bar; fonts load.

**Stage 4: hero and pillars**
Files: `Hero`, `SectionHeader`, `PillarCard`; replace `index.astro` with Hero, then the pillars section (`id="pillars"`, with SoundingsBackground), using `.grid`.
Check: full-screen map hero (blurred in the centre, sharp at the edges), animated logo on a soft glow, frosted tagline card, stamp, scroll cue. Scrolling reveals a plain cream section with four pillar cards that tilt on hover.

**Stage 5: work, blog teaser, CTA (landing complete)**
Files: `ProjectCard`, `PostCard`, `CTABand`; update `index.astro` to add RhumbDivider, Featured work (3 ProjectCards), Blog teaser (2 PostCards) and a CTABand ("Got a map problem?", link to `/contact`).
Check: the whole landing page works top to bottom with real sample content and images.

**Stage 6: portfolio and blog pages**
Files: `TagFilter`, `portfolio/index.astro`, `portfolio/[slug].astro`, `blog/index.astro`, `blog/[slug].astro`.
Check: tag buttons filter the grid; cards open detail pages with image, tags, tools, body; blog list and post pages work; unknown URLs do not crash the build.

**Stage 7: contact and 404**
Files: `ContactRow`, `ContactForm`, `PhoneLink`, `contact.astro`, `404.astro`.
Check: the email and phone are assembled in the browser by `EmailLink` and `PhoneLink` (the built HTML never contains the full address or number; with JavaScript off they show a fallback); the email is a `mailto:` link and the phone a `tel:` link; ArtStation and LinkedIn open in a new tab; the form has labelled fields and a honeypot; the availability note shows; `/nothing-here` shows the 404 page.

**Stage 8: README, cleanup, production build**
Delete `src/pages/dev.astro`, `public/favicon.ico` (the Astro template's icon) and `AGENTS.md`. Replace `README.md` (file to write: `README.md` only) with: install and run commands; project structure; how to add a project, a post, a service and a nav page; how to change site details in `site.ts`; hero tuning variables; and deployment notes: host on Cloudflare Pages (framework preset Astro, build command `npm run build`, output directory `dist`, set `NODE_VERSION` if the build fails); domain registered at Hostinger with nameservers changed to the two Cloudflare nameservers; custom domain `www.mabinogis.com`; a Cloudflare redirect rule from the apex `mabinogis.com` to `https://www.mabinogis.com`; replace `YOUR_ID` in `site.ts` with the Formspree form ID; turn on Cloudflare Email Address Obfuscation.
Check: `/dev` no longer exists; `npm run build` and `npm run preview` complete with no errors; every internal link on every page resolves.

**Stage 9 (optional): hero parallax**
One vanilla `<script>` in `Hero.astro`; no new files. `.hero__bg` uses `transform: translate3d(0, var(--parallax, 0px), 0) scale(1.08)` and `will-change: transform`. The script sets `--parallax` on `.hero__bg` to `scrolled * SPEED` px (`SPEED = 0.4`), where `scrolled` is `-hero.getBoundingClientRect().top` clamped between 0 and the hero height, updated through `requestAnimationFrame` from passive `scroll` and `resize` listeners. When `matchMedia("(prefers-reduced-motion: reduce)").matches`, it removes `--parallax` and does nothing.
Check: the background drifts slower than the page; with reduced motion enabled in the OS it stays still; no gaps appear at the hero edges.

---

## 8. Astro pitfalls and the correct pattern

| Mistake a small model makes | Correct pattern |
|---|---|
| Uses Astro 6 or older APIs, or `Astro.glob` | Astro is pinned to `^5`. Use `getCollection` from `astro:content`. `Astro.glob` does not exist. |
| Uses `entry.slug` or `entry.render()` | Astro 5: use `entry.id` for the slug and `const { Content } = await render(entry)` with `import { render } from "astro:content"`. |
| Puts config at `src/content/config.ts` | It is `src/content.config.ts` (project `src/` root) and uses `loader: glob(...)`. |
| Forgets `getStaticPaths` in `[slug].astro` | Required. `return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));` then `const { entry } = Astro.props;`. |
| Wrong import paths (`../components/...`) | Always use the alias: `import Logo from "@/components/Logo.astro";`. Only markdown frontmatter image paths are relative (`../../assets/portfolio/x.jpg`). |
| Uses `<img src="/src/assets/...">` or a string path for local images | `import bg from "@/assets/backgrounds/bg-1-blur.webp"; import { Image } from "astro:assets";` then `<Image src={bg} alt="" />`. For content covers, `data.cover` is already image metadata: `<Image src={cover} alt={title} width={800} />`. Always give `alt`. |
| Writes React syntax (`className`, `htmlFor`, `onClick`, hooks, `useState`, JSX files) | Astro uses `class`, `for`, plain HTML attributes, and `.astro` files. Interactivity goes in a `<script>` tag using `document.querySelector` and `addEventListener`. |
| Uses frontmatter variables inside `<script>` | Scripts cannot see frontmatter. Pass data with `data-*` attributes on elements and read `el.dataset`. |
| Scoped CSS does not reach `<Image>` output, SVG added by a child component, or elements created by a script | Wrap the element and use `.wrapper :global(img) { ... }`. Use `:global()` sparingly and always under a scoped parent class. |
| Passes unknown props or forgets defaults | Declare `interface Props` and destructure with defaults exactly as in §2. |
| Hardcodes colours (`#BF4C2C`, `white`) | Use only `var(--...)` tokens. |
| Imports fonts wrongly | In `BaseLayout.astro` frontmatter only: `import "@fontsource/baskervville/400.css"; import "@fontsource/source-serif-4/400.css"; import "@fontsource/source-serif-4/600.css"; import "@fontsource/ibm-plex-mono/400.css"; import "@fontsource/ibm-plex-mono/500.css";`. If a weight import fails, remove that line. |
| Shows draft items | Filter: `getCollection("portfolio", ({ data }) => !data.draft)`. |
| Date handling breaks | Schema uses `z.coerce.date()`. Display with `date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })`. |
| Makes the hero `position: fixed` | Hero is a normal section with `min-height: 100svh`. Only the sidebar and mobile bar are fixed. |
| Edits `Logo.astro` or re-draws the logo | Never. Import it and pass `size` and `animate`. Its repeated SVG ids across multiple instances are harmless; leave them. |
| External links without safeguards | `target="_blank" rel="noopener noreferrer"`. |
| Missing UTF-8, so "Đuranović" breaks | `<meta charset="utf-8">` must be the first element in `<head>`. Save all files as UTF-8. |
| Adds dependencies not listed | Only `astro@^5` and the three `@fontsource/*` packages. Nothing else without a `QUESTION:`. |
| Uses `Math.random()` for the soundings | Use the seeded LCG so output is deterministic and the build is reproducible. |
| Rewrites unchanged files "..." or leaves placeholders | Output every file in full, with real content. |
| Card images render far too tall or stretched | Astro's `<Image>` writes `width` and `height` attributes. In CSS use `width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover;`. |
| A date shows one day early | Format with `toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })`. |
| Uses a component in the template without importing it ("X is not defined" crash) | Every component tag used in a template needs an import line in the frontmatter (`Image` from `astro:assets`, plus each `@/components/...` file). Before finishing, list every tag used and confirm each has an import. |
| Puts `<Graticule />` or `<SoundingsBackground />` outside the card or section | They must be INSIDE the `position: relative` element they decorate (inside the `<article class="card">`, inside the section). |
| Passes `class="..."` to a component such as `<Stamp>` and expects it to apply | Components do not forward `class` automatically. Wrap it: `<span class="project__stamp"><Stamp ... /></span>` and style the span. |
| Card text turns vermilion | Global `a` is vermilion. A card link needs `color: var(--ink)` and `text-decoration: none`. |
| Repeats hover tilt on the inner link | Tilt comes only from `.card--tilt:hover` on the card. Do not add `transform` on the inner link. |
| Whole-card links break the layout | Use `<article class="card"><a class="..." href>...</a></article>`; the link is `display: block` and contains the card content. No nested links. |
