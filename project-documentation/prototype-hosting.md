# FFP - Prototype Hosting

## Overview

The web package contains dev-only UX prototypes and component showcases under the `/components/*` routes (for example the assessment authoring prototype at `/components/assessment-admin`). These pages use mock data and local state only: no API, database, authentication, or `@ffp/core` calls. The normal production build strips them, so they need a separate build and host to be shared with stakeholders for remote review.

This document describes the **showcase build** and the **Cloudflare Pages** deployment that hosts it behind an access gate. It is the operational reference for refreshing the hosted prototypes over time.

## Live site

- **Hosted URL (share this):** https://prototypes.tregaskis.uk/components
- **Underlying Pages hostname:** `ffp-prototypes.pages.dev` (the custom domain is a CNAME to this)
- **Access:** gated by Cloudflare Access (Zero Trust) — only email addresses on the allow-list can reach it, via a one-time PIN sent to their inbox. No account or password.

Send reviewers the `/components` path, not the bare root: the root resolves to the app's authenticated home page, which redirects to a login the showcase build cannot complete (auth is stubbed out). `/components` is the public menu that lists every prototype.

## Showcase build

The build keeps the dev-only routes and wires deliberately dummy backend configuration so nothing real is embedded.

```bash
pnpm --filter=@ffp/web build:showcase
```

How it works:

- A `showcase` Vite mode (`vite build --mode showcase`) loads `packages/web/.env.showcase`, which sets `VITE_SHOWCASE=true` plus dummy Cognito/API values. `.env.showcase` is committed and must only ever hold dummy values, because the resulting bundle is hosted publicly (gated only by Access).
- The router keeps dev-only routes when `VITE_SHOWCASE=true`, even in a production build. The default `pnpm --filter=@ffp/web build` is unchanged and still strips them, so the real production deploy is unaffected.
- `packages/web/public/_redirects` provides the single-page-app catch-all (`/*  /index.html  200`) that Cloudflare Pages needs for client-side routing. It is inert on the real S3/CloudFront production deploy.

Preview locally before deploying:

```bash
pnpm --filter=@ffp/web preview
```

## Deploy and refresh

Prerequisites: Wrangler installed and authenticated (`npm i -g wrangler` then `wrangler login`).

To publish a fresh version of the prototypes:

```bash
pnpm --filter=@ffp/web build:showcase
wrangler pages deploy packages/web/dist --project-name ffp-prototypes
```

Each deploy publishes a new version to the same URL. The custom domain and Access gate stay as configured; only the content updates.

## Access management

Access is configured in the Cloudflare dashboard (not in this repo):

- **Zero Trust → Access controls → Applications → "FFP Prototypes"** protects the `prototypes.tregaskis.uk` destination.
- The **"Allowed reviewers"** policy holds the email allow-list. To add or remove a reviewer, edit that policy's email list — no rebuild or redeploy needed.

The allow-list is intentionally not recorded here, to keep reviewer email addresses out of version control.

## Notes and limitations

- Throwaway by design: the prototypes are disposable UX explorations, not production code. They reuse real themed components and patterns so the UX maps cleanly to the eventual build.
- The bundle carries no real infrastructure configuration. Confirm this after any change with:
  `grep -rEo "https://[a-z0-9.-]+" packages/web/dist/assets | grep -Ev "showcase.invalid"` — expect only library and placeholder hosts.
- The raw `ffp-prototypes.pages.dev` URL is not covered by the Access policy (only the custom domain is). Share the `prototypes.tregaskis.uk` link.
  </content>
