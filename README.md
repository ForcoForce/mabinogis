# Mabinogis website

Portfolio site for **Mabinogis**, the map design, GIS analysis and geospatial database studio of Marko Đuranović, M.A.
Built with [Astro](https://astro.build) 5 as a fully static site. No frameworks, no backend.

- Live site: https://www.mabinogis.com
- Hosting: Cloudflare Pages
- Contact form: Formspree

## Quick start

Requires Node.js 20 or newer.

```
npm install
npm run dev        # development server at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Always run `npm run build` and `npm run preview` before deploying a big change.

## Project structure

```
src/
  content/
    portfolio/        one markdown file per project
    blog/             one markdown file per blog post
  assets/
    backgrounds/      hero images (bg-1-blur.webp, bg-1-original.webp)
    portfolio/        project cover images
  data/
    site.ts           name, email, phone, socials, form address, navigation
    services.ts       the four service cards on the home page
  components/         reusable building blocks (cards, sidebar, hero, chart decorations)
  pages/              one file per page (index, portfolio, blog, contact, 404)
  styles/
    tokens.css        colours, fonts, spacing (change the look here)
    global.css        base styles
  content.config.ts   rules for the portfolio and blog files
public/               favicon and robots.txt
```

## Everyday tasks

### Change contact details, tagline or links
Edit `src/data/site.ts`. The footer, sidebar and contact page all read from it.
Email and phone are assembled in the visitor's browser (see "Spam protection" below), so change them only in this file.

### Add a project
1. Put a cover image in `src/assets/portfolio/` (for example `portfolio_6.png`).
2. Create `src/content/portfolio/portfolio-6.md`:

```md
---
title: "Project title"
summary: "One short sentence about the project."
cover: "../../assets/portfolio/portfolio_6.png"
tags: ["Map design"]
tools: ["QGIS", "Inkscape"]
year: 2026
featured: false
draft: false
---
Write about the project here. Markdown works: headings, lists, links, quotes, code.
```

- `featured: true` makes it eligible for the "Recent projects" section on the home page (the first three are shown).
- `draft: true` hides it everywhere without deleting it.
- The filter buttons on the portfolio page are created automatically from the tags.
- The file name becomes the page address (`/portfolio/portfolio-6`).

### Add a blog post
Create `src/content/blog/my-post.md`:

```md
---
title: "Post title"
description: "One sentence shown on the cards."
pubDate: 2026-11-10
tags: ["Map design"]
draft: false
---
Write the post here.
```

Optional: `updatedDate: 2026-11-12` and `cover: "../../assets/..."` (a relative image path).
The two newest posts appear on the home page.

### Edit or add a service card
Edit `src/data/services.ts`. Each entry needs an `id`, `title`, `blurb`, `coord` label and an `icon`.
The available icons are `map`, `analysis`, `database` and `cog`. A new icon needs a small SVG added in `src/components/PillarCard.astro`.

### Add a new page to the navigation
1. Create the page file, for example `src/pages/services.astro`, using `BaseLayout` like the other pages.
2. In `src/data/site.ts`, find the reserved entry for it in `nav` and change `enabled: false` to `enabled: true`. (Or add a new entry.)

### Adjust the home page hero
At the top of the `<style>` block in `src/components/Hero.astro` there are three tuning values:

| Value | What it does |
|---|---|
| `--blur-full-until` | How far from the centre the map stays fully blurred. |
| `--blur-gone-at` | Where the blur has faded out completely (sharp map). |
| `--glow-opacity` | Strength of the soft glow behind the logo. |

The overall strength of the background is `--hero-bg-opacity` in `src/styles/tokens.css`.

### Change colours and fonts
Everything is defined in `src/styles/tokens.css`. Components only use these variables.

## Spam protection

- The contact **email** and **phone** are never written in full into the page HTML. `EmailLink.astro` and `PhoneLink.astro` store them in pieces and a small script joins them in the visitor's browser. With JavaScript turned off, visitors see a fallback instead.
- Do not type your address or number directly into page text or markdown posts. If you must, Cloudflare's Email Address Obfuscation (see below) helps cover addresses typed directly.
- The contact form has a hidden trap field (`_gotcha`) that Formspree uses to catch bots.

## Deployment (Cloudflare Pages)

Menu names in dashboards change from time to time, so treat the steps below as a guide.

### 1. Put the project on GitHub
```
git add .
git commit -m "Describe what you changed"
```
Create an empty repository on GitHub (no README), then:
```
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### 2. Move the domain's DNS to Cloudflare
1. Add `mabinogis.com` as a site in Cloudflare (the free plan is enough).
2. Cloudflare shows two nameservers. At Hostinger, open the domain's DNS / nameserver settings and replace the existing nameservers with those two.
3. Wait until Cloudflare reports the domain as active (minutes to a few hours).

### 3. Create the Pages project
1. In Cloudflare: Workers & Pages, create a Pages project and connect the GitHub repository.
2. Settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. If the first build fails with a Node.js version error, add an environment variable `NODE_VERSION` set to `20` (or `22`) and rebuild.

### 4. Connect the domain
1. In the Pages project, open Custom domains and add `www.mabinogis.com`. Because the DNS is on Cloudflare, the record is created for you.
2. Redirect the bare domain to `www`: in Cloudflare, create a Redirect Rule (Rules section) that sends `mabinogis.com` to `https://www.mabinogis.com` (301, keep the path). The bare domain needs a proxied DNS record for the rule to trigger. A common placeholder is an `A` record for `@` pointing to `192.0.2.1` with the proxy switched on.

### 5. Turn on email obfuscation
In the Cloudflare dashboard for your domain, find **Email Address Obfuscation** (under Scrape Shield or the Security settings) and switch it on.

### 6. Set up the contact form
1. Create a free account at https://formspree.io and make a new form that sends to `marko@mabinogis.com`.
2. Copy the form ID (the part after `/f/`).
3. In `src/data/site.ts`, replace `YOUR_ID` in `formAction` with it, commit and push.
4. After the site is live, send yourself a test message.

Every push to `main` redeploys the site automatically.

## Launch checklist

- [ ] `npm run build` and `npm run preview` run without errors
- [ ] Formspree ID set and a test message received
- [ ] Placeholder projects and posts replaced with real ones (or set to `draft: true`)
- [ ] Availability line in `site.ts` is accurate
- [ ] `https://mabinogis.com` redirects to `https://www.mabinogis.com`
- [ ] View page source on a deployed page and confirm no plain email or phone number appears
- [ ] Check the site on a phone

## Future ideas (already prepared for)

- **Interactive map (MapLibre):** add `maplibre-gl`, create `src/components/MapIsland.astro`, and place it where the home page has room.
- **RSS feed:** install `@astrojs/rss`, add `src/pages/rss.xml.js`, enable the RSS entry in `nav`.
- **Sitemap:** add the `@astrojs/sitemap` integration in `astro.config.mjs`.
- **Dark mode:** add `:root[data-theme="dark"]` overrides in `tokens.css` and a toggle in the sidebar.
