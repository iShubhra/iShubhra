# Shubhra Ghosh — Portfolio

Personal engineering portfolio: **backend · distributed systems · Go**.

100% static — HTML, CSS, and vanilla JavaScript. No framework, no build step,
no backend. Runs anywhere you can serve a folder and deploys directly to
GitHub Pages or GitLab Pages.

## Structure

```text
├── index.html          # all content + markup (semantic, SEO-ready)
├── css/
│   ├── style.css       # design system + components
│   └── responsive.css  # tablet / mobile breakpoints
├── js/
│   ├── main.js         # nav, active-section spy, copy-email, back-to-top
│   ├── animations.js   # scroll reveal, hero packet animation, reduced-motion
│   ├── lab.js          # interactive Engineering Lab simulations
│   └── github.js       # live repo cards with graceful fallback
└── assets/
    ├── favicon.svg
    └── og-image.svg    # social share placeholder
```

## Run locally

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Deploy

**GitHub Pages**

1. Push this repo to `github.com/iShubhra/iShubhra` (or your username repo).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → branch `main`, folder `/ (root)`.
3. Site is live at `https://<username>.github.io/`.

**GitLab Pages**

1. Push to a GitLab repo.
2. Add a `.gitlab-ci.yml` (static pages job from the `public/` folder — copy the
   site into `public/` first, or use `artifacts` with the repo root).

## Before you publish

- **Canonical / OG URLs** — `index.html` points to `https://ishubhra.github.io/`.
  Update the `<link rel="canonical">`, `og:url`, `og:image`, and the JSON-LD
  `url` if your domain differs.
- **Social share image** — `assets/og-image.svg` is a placeholder. Many apps
  require PNG/JPG; generate `assets/og-image.png` (1200×630) from it and update
  the `og:image` path if needed. (LinkedIn/Facebook don't render SVG well.)
- **Open Source section** — repositories load live from the GitHub API
  (`github.com/shubhrakantighosh`, top 6 by last update). If the API is
  unreachable you'll see clearly-marked placeholder cards. Fill in real
  repository names in `PLACEHOLDER_REPOS` inside `js/github.js`.
- **Accessibility / motion** — the site respects `prefers-reduced-motion`:
  scroll reveals, packet animations, and the sims all quiet down.

## Notes

- The Engineering Lab simulations (worker pool, request flow, fault-tolerant
  stream) run entirely in your browser; nothing is sent anywhere.
- No external JS dependencies. Fonts load from Google Fonts with local
  fallbacks; the site still looks correct without them.