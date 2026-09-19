---
name: hub-page
description: Author or refresh a page in the local visual Working Docs Hub (.claude/local/hub/) — roadmaps, designs, patterns, briefings, archive. Teaches the shell skeleton, the single nav.js entry, the file://-safe / no-fetch rules, and the lane / card layout that is the default for Epic Roadmap pages. Use when an orchestration principal (or any session) needs to add or update a roadmap/design/pattern/briefing page in the hub.
---

# Hub Page — authoring pages in the Working Docs Hub

## Overview

The **Working Docs Hub** is a small, local, gitignored static site at `.claude/local/hub/` that holds the project's visual working docs — epic roadmaps, delivery patterns, and retired decision aids — under one shared shell with a persistent left side-nav. It opens straight from disk over `file://` (double-click), with **no build step, no dev server, no network**. It lives under `.claude/local/`, so it syncs to HQ and is gitignored from the project repo.

Use this skill when you need to **add a new page** or **refresh an existing one** — most often an Epic Roadmap, which a plan principal renders/updates as its living visual overview. New roadmaps go **into the hub** rather than becoming standalone HTML files, and the **lane / card layout** is the default for Epic Roadmap pages.

Authoritative companion: **`.claude/local/hub/README.md`** (this skill mirrors and extends it). The canonical template page is **`.claude/local/hub/roadmaps/assessment-flow-admin.html`** — open it and copy its lane / card markup.

## The one load-bearing rule: no `fetch()` over `file://`

Browsers block `fetch()`/XHR from a `file://` page (CORS), so anything fetched at runtime **silently fails** when someone double-clicks a page. Share code the only way that works from disk:

- **CSS** via `<link rel="stylesheet" href="…/assets/styles.css">`
- **JS** via `<script src="…/assets/hub.js">` (and `nav.js`)

Never introduce a `fetch`-based partial/include, an external CDN, an ES-module `import`, or a remote font/image. Every asset is relative and self-contained. (Audit before finishing: `grep -rn "fetch(\|https\?://\|import .* from" .claude/local/hub` should return nothing but comments.)

## Core concepts

### Structure

```
.claude/local/hub/
  index.html                    # landing page (overview + link tiles)
  assets/
    styles.css                  # shared tokens + the shell + the lane / card template
    nav.js                      # the menu — SINGLE SOURCE OF TRUTH
    hub.js                      # builds the shell (side-nav, top bar, main column)
  roadmaps/                     # Epic Roadmap pages  → lane / card layout
  designs/                      # a proposed shape, still under discussion
  briefings/                    # plain-English pages to read then talk from (Hanan)
  patterns/                     # how-it-works reference pages (may be bespoke)
  archive/                      # retired pages (+ any page-local asset folders)
  README.md
```

### The shell (`hub.js`)

Every page is just a small `<head>` plus a single content wrapper. On load, `hub.js`:

1. reads `window.HUB_ROOT` (set inline per page) and `window.HUB_NAV` (from `nav.js`),
2. builds the shell **around** `#hub-content`: the left **side-nav** (nested groups + a pinned, de-emphasised **Archive**), a slim sticky **top bar** breadcrumb, and the **main column**,
3. **moves** the page's authored markup (everything in `#hub-content`) into that main column,
4. highlights the active page (matched by **filename**) and opens its nav group.

There is **no per-page nav markup** — the nav lives only in `nav.js`.

### `HUB_ROOT` — the depth rule

`HUB_ROOT` makes links resolve from any folder depth over `file://`:

- `index.html` at the hub root → `window.HUB_ROOT = ''`
- any page one folder deep (`roadmaps/`, `patterns/`, `archive/`) → `window.HUB_ROOT = '../'`

Every `path` in `nav.js` is written **root-relative** (e.g. `roadmaps/assessment-flow-admin.html`); `hub.js` prefixes it with `HUB_ROOT`. The page's own `<link>`/`<script>` tags use the matching literal prefix (`../assets/…` for a one-level page, `assets/…` at the root).

### `nav.js` — the menu, single source of truth

```js
window.HUB_NAV = {
  home: { title: 'Working Docs', subtitle: 'Fit For Purpose', path: 'index.html' },
  groups: [
    {
      title: 'Epic Roadmap',
      items: [
        {
          label: 'Assessment & Programme Authoring',
          path: 'roadmaps/assessment-flow-admin.html',
          note: 'active',
        },
      ],
    },
    {
      title: 'Patterns',
      items: [
        /* … */
      ],
    },
  ],
  archive: {
    title: 'Archive',
    items: [{ label: 'An Old Page', path: 'archive/old-page.html', note: 'retired' }],
  },
};
```

Field reference per item: `label` (nav text), `path` (root-relative), `note` (optional short right-aligned chip, e.g. `Epic 2`, `v2`, `✓`). `archive` is a special group pinned to the bottom and visually muted. Groups render as expandable `<details>` (open by default).

## The page skeleton

Start every page from this. For a one-level-deep page (the normal case):

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Epic N — Your title — roadmap</title>
    <link rel="stylesheet" href="../assets/styles.css" />
    <!-- Optional: a page-local <style> block ONLY for a bespoke layout (see below) -->
  </head>
  <body>
    <div id="hub-content">
      <div class="page">
        <!-- your page's own markup goes here -->
      </div>
    </div>

    <script>
      window.HUB_ROOT = '../';
    </script>
    <script src="../assets/nav.js"></script>
    <script src="../assets/hub.js"></script>
  </body>
</html>
```

`<div class="page">` is the shared centred white column (max-width, padding, surface background) — use it for a standard roadmap. Bespoke pages may use their own container instead (see "Bespoke pages").

## Adding a page — three small steps

1. **Create the `.html`** in the right folder (`roadmaps/`, `designs/`, `patterns/`, `briefings/`, or `archive/`) from the skeleton. For an Epic Roadmap, copy the lane / card markup from `roadmaps/assessment-flow-admin.html`.
2. **Add one entry to `nav.js`** — drop it into the right group's `items` (or add a new group). Root-relative `path`:
   ```js
   { label: 'My New Epic', path: 'roadmaps/my-new-epic.html', note: 'Epic 3' }
   ```
   Retired page → add to the `archive` group instead.
3. **(Optional) add a landing tile** to `index.html` if you want it surfaced there.

The side-nav, active-state, and breadcrumb all come for free.

## Refreshing an existing roadmap

Editing in place is all that's needed — the shell, nav highlight and breadcrumb re-derive on load. Just edit the page's `#hub-content` markup (add/close lanes, flip a `.tag`, update a `.sub`). If the page's title or nav position changes, update its `nav.js` entry too. Because a plan principal keeps a roadmap as a living doc, expect to **flip card status tags** (`ready` → `progress` → `done`) and add lanes over the epic's life rather than regenerate the page.

## The lane / card template — DEFAULT for Epic Roadmap pages

This is the preferred layout for a detailed epic roadmap. The plain HTML **is** the template — copy it, don't hide it behind a component. The classes live in `styles.css`; the tint is driven off the lane's modifier class.

```html
<div class="lanes">
  <section class="lane delivery">
    <!-- tint modifier — see table below -->
    <h2>
      <span class="seq">2 ·</span> Delivery &amp; release automation
      <span class="lane-note">optional right-aligned aside</span>
    </h2>
    <div class="lane-cards">
      <div class="card">
        <span class="tag done">Landed</span>Card title
        <span class="effort">~3</span>
        <span class="sub">The muted supporting detail line.</span>
      </div>
      <div class="card">
        <span class="tag ready">Ready now</span>Another card
        <span class="sub">…</span>
      </div>
    </div>
  </section>
  <!-- more <section class="lane …"> lanes … -->
</div>
```

Wrap the lanes with the standard roadmap furniture (all shared classes):

```html
<div class="page">
  <header class="intro">
    <h1>Epic N — Title</h1>
    <p>One-line framing of the epic.</p>
  </header>

  <p class="banner"><strong>Optional headline.</strong> A dashed amber status note.</p>

  <div class="lanes">…</div>

  <p class="footnote">Closing muted note, links to related pages.</p>
</div>
```

### Building blocks

- **`.lane`** — a vertical section: an uppercase `h2` (`.seq` = the number, `.lane-note` = a right-aligned aside) over `.lane-cards`. Add a **tint modifier** to colour the lane's cards.
- **`.card`** — a titled card. `.sub` = the muted detail line; `.effort` = a small right-of-title estimate (`~3`); `.optional` = dashed border.
- **`.tag …`** — a status pill (goes first, inside the card title line).
- **Parked auto-dim** — a card carrying `.tag.cond` or `.tag.gated` (or given `.card.moved`) auto-dims to read as de-prioritised. The bright `.tag.gate` (a live go-live gate) stays full-strength — use it deliberately.
- **`header.intro`**, **`.banner`** (dashed amber note), **`.footnote`** — the page furniture.

### Tint modifiers (`section class="lane <tint>"`)

| Modifier    | Reads as              | Colour  |
| ----------- | --------------------- | ------- |
| `decisions` | settled calls / gates | amber   |
| `infra`     | infrastructure        | grey    |
| `delivery`  | delivery / release    | blue    |
| `hardening` | hardening / observ.   | purple  |
| `security`  | security              | red     |
| `feedback`  | client feedback       | teal    |
| `locale`    | localisation          | violet  |
| _(none)_    | plain / conditional   | neutral |

### Tag variants (`span class="tag <variant>"`)

| Variant    | Typical use                        |
| ---------- | ---------------------------------- |
| `done`     | Landed / Done / Decided / Resolved |
| `ready`    | Ready now                          |
| `progress` | In progress                        |
| `spike`    | Spike / pattern                    |
| `decision` | A decision to make                 |
| `gated`    | Blocked / gated (auto-dims card)   |
| `ext`      | External / someone else's          |
| `cond`     | Conditional / deferred (auto-dims) |
| `gate`     | Live go-live gate (stays bright)   |

## Bespoke pages (patterns / archive)

Not every page is a lane/card roadmap. A pattern or archive page with a unique layout keeps its own CSS in a **page-local `<style>` block** and leans on the shared tokens + shell. That's fine — "the page body is whatever suits that page." **New** epic roadmaps should prefer the lane / card layout above.

When writing a bespoke page:

- Give its container its own class (`.wrap`, not `.page`) and put its own padding on it (the shell strips `body` padding).
- **Do not reuse a shared class name** (`.page`, `.card`, `.lane`, `.tag`) for something structurally different — either pick a different name or fully override the rule in the page's own `<style>`. (Real lesson: a page once used a generic `header class="page"` that collided with the shared `.page` container and had to be renamed to `doc-head`.)
- Page-local assets (images) go in a sibling folder (e.g. `roadmaps/assessment-assets/`) referenced with a page-relative `src` — they load fine over `file://`.

## Shared design tokens

`styles.css` exposes CSS custom properties you can reuse in a bespoke `<style>`: `--ink`, `--ink-muted`, `--rule`, `--rule-soft`, `--surface`, `--bg`, and the tint families `--blue-*`, `--grey-*`, `--purple-*`, `--amber-*`, plus `--decision-*`. Reuse these so bespoke pages stay visually of a piece with the shell. (`styles.css` has no exposed green/red token — define a page-local one, matching the existing pages' `#0f8a55` green / `#b3403f` red, if a bespoke page needs it.)

## Cross-page links inside content

From a one-level-deep page, link to another page **root-relative with `../`**:

- same folder → just the filename: `<a href="assessment-flow-admin.html">…</a>`
- another folder → `<a href="../patterns/rls-context-flow.html">…</a>`, `<a href="../archive/old-page.html">…</a>`

(These are authored links in your markup, distinct from the nav — the nav's `HUB_ROOT`-prefixed links are handled by `hub.js`.)

## Common pitfalls

| Pitfall                                                         | Fix                                                                                      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `fetch`/XHR/CDN/`import` for shared code                        | Never — use `<link>` CSS + `<script src>` JS; it silently fails over `file://`           |
| Wrong `HUB_ROOT`                                                | `''` at the hub root, `'../'` one folder deep — matches the `<link>`/`<script>` prefixes |
| Shared class-name collision (`.page`, `.card`, `.lane`, `.tag`) | Rename the bespoke element or fully override the rule in the page's `<style>`            |
| Nav entry `path` not root-relative                              | Always root-relative (`roadmaps/x.html`), never `../` — `hub.js` adds `HUB_ROOT`         |
| Forgot the nav entry                                            | The page loads but isn't reachable from the side-nav — add the `nav.js` item             |
| Content not inside `#hub-content`                               | `hub.js` mounts around `#hub-content` — everything visible must be inside it             |

## Verifying

The extension can't open `file://` directly, so to screenshot: serve read-only over a throwaway local HTTP server and drive the browser at `http://127.0.0.1:<port>/…` — the relative `<link>`/`<script src>` loading and `hub.js` shell behave identically. Then double-check no `fetch` slipped in (it would only fail over real `file://`, not `http://`) with the grep audit above. Confirm: the side-nav renders with the new entry, active-state highlights the current page, the breadcrumb reads `Group / Page`, and cross-page nav works.

```bash
cd .claude/local/hub && python3 -m http.server 8777 --bind 127.0.0.1   # then browse, then stop it
```

## Conventions

- **British English** in content (colour, behaviour, catalogue, organise, licence).
- **Body text fills its container.** Set the width once on the page container (`.page`, or a bespoke page's own wrapper) and put **no** second `max-width: NNch` on `p`, `li`, `figcaption` or a standfirst. The general "keep running text near 65 characters" measure rule fights a container sized for tables and diagrams — at 62rem a `62ch` cap renders body copy at roughly half width, reading as a narrow column in a wide frame. A narrow column for one element is a deliberate exception, not the default.
- **No `fetch` / CDN / build / ES-module import** — relative, self-contained assets only.
- The **lane / card layout is the default** for Epic Roadmap pages; bespoke layouts only when the content genuinely needs one.
- It's a **personal working tool** (gitignored, HQ-synced) — reasonable best practice, not perfection. Git history writes stay the user's; don't commit or push from a page-authoring session.

## Related

- `.claude/local/hub/README.md` — the in-hub companion (kept in step with this skill).
- An orchestration principal keeps its epic roadmap page in the hub via this skill — see `.claude/local/plans/prompts/` for the live kickoffs.
- `review` / `bug-review` / `full-review` — the review trio; their findings go to `review-comments.md`, never into a hub page.
