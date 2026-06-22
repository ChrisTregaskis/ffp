---
name: prototype
description: Build a throwaway, dev-only, mock-data UX prototype in the FFP web package to de-risk a real build — exploring flows and layouts fast WITHOUT a database, API, or @ffp/core. Use when the user wants to prototype an admin/authoring/UX surface before production code. Prototypes are disposable but still reuse real components, theme colours, and patterns so the UX maps cleanly to the eventual build.
argument-hint: 'surface to prototype, e.g. assessment-admin authoring'
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(pnpm dev:web), Bash(pnpm lint*), Bash(pnpm format*), Bash(pnpm typecheck*), Bash(turbo *), Bash(npx tsc*), Bash(npx eslint*)
---

# FFP UX Prototyping

Build a **throwaway, clickable, mock-data prototype** of a UI surface to lock down the UX before any
production code exists. The goal is to explore layout, navigation, and interaction fast — and to
de-risk the real build — while staying close enough to FFP's real components and patterns that the
prototype→production mapping is mostly mechanical.

A prototype is **disposable scaffolding**, not a first draft of shipped code. It is deleted, not
migrated, once the real surface lands. But "disposable" is not "sloppy": it must still pass gates,
reuse real components, and respect the design system — otherwise it teaches the real build the wrong
lessons and stakeholders review against a false picture.

This skill is the prototyping-specific layer on top of the `frontend` skill. **Read the `frontend`
skill first** for the component/theme/British-English rules — they all apply here. This file adds the
rules that are _specific to prototypes_.

## The five non-negotiables

1. **Dev-only, one route.** Everything lives under `packages/web/src/pages/dev/<prototype-name>/` and
   is reachable at a single `/components/<prototype-name>` route, gated `devOnly: true` +
   `excludeFromMainNavbar: true`. It never appears in the real app navigation.
2. **No real data layer.** No `@ffp/core` / `@ffp/database` imports, no network calls, no TanStack
   Query, no RLS. All data is mock, in-memory, and local to the prototype directory. This keeps the
   prototype self-contained and impossible to accidentally wire to production.
3. **Reuse real components.** Use the actual app components (`Table`, `Select`, `Button`, `Modal`,
   `Icon`, `Text`/`Title`, `ComposableForm`, `DropdownMenu`, `SearchInput`, `ProgressBar`, etc.) —
   never raw HTML where a component exists. This is what makes the UX faithful and the eventual build
   cheap. If you find yourself hand-rolling a control the app already has, stop and reuse it.
4. **Theme + conventions still apply.** Theme colours only, themed text components, arrow-function
   `React.FC`, **one component per file**, British English, no emojis. Gates (`typecheck` +
   `eslint --max-warnings 0`) must stay green throughout.
5. **No planning-jargon or `.claude/local` references in the prototype files.** They live in the
   tracked tree (even if dev-only). No "Phase 4"/"T3-5" labels, no links to local planning artefacts.
   Describe the thing, not the planning label.

## Before you build — scope and survey

1. **Confirm it's genuinely a prototype.** If the user wants production code, use the `frontend` skill
   instead. Prototype = exploring UX, disposable, mock data.
2. **Survey real components first.** `Glob packages/web/src/components/**` and read 2–3 existing pages
   that already do something similar (list pages, edit pages, config editors). The prototype should
   look like it belongs. Key groups available: `table/`, `form/`, `select/`, `button/`, `modal/`,
   `dropdown-menu/`, `search/`, `panel/`, `feedback/` (StaticAlert), `Card/`, `Icon/`, `text/`,
   `ProgressBar/`, `accordion/`, `tooltip/`.
3. **Find the real domain shapes to mirror.** Read the relevant `@ffp/core` schemas / `@ffp/database`
   types so the mock types mirror real field names. Don't import them — **re-declare local types** in
   the prototype so it stays self-contained, but keep the names faithful.
4. **If behaviour matters, verify the real logic.** When a prototype simulates real behaviour (e.g. a
   scoring engine), read the real implementation and re-implement it faithfully as pure local
   functions. Consider a read-only sub-agent to document the real logic so the mock doesn't drift.

## Recommended structure

A self-contained directory under `pages/dev/<name>/`, one component per file:

```
pages/dev/<name>/
├── <Name>PrototypePage.tsx     # entry component the route renders
├── PrototypeShell.tsx          # nav/chrome (mirror the real SideMenu/layout)
├── PrototypeStore.tsx          # React context: mock data + mutators (in-memory)
├── prototype-types.ts          # local types mirroring real domain shapes
├── prototype-data.ts           # mock seed data (faithful to real shapes)
├── prototype-labels.ts         # display labels, enum→label maps
├── prototype-styles.ts         # shared control-class constants (one source)
├── prototype-scoring.ts        # any faithful re-impl of real logic (pure fns)
└── <View>.tsx + helpers        # one component per file, extracted helpers in their own files
```

State lives in an in-memory store (React context) with mutators that mimic the real API surface
(`create*`, `update*`, `reorder*`, `delete*`) — so the prototype demonstrates the real interaction
model without a backend. Internal navigation can be a state-based mini-router (a discriminated-union
`View` type) to keep everything on one route.

## Wiring the single dev route

Three small edits to the tracked routing files (mirror an existing `/components/*` showcase entry):

1. **`pages/routes/RouteKey.ts`** — add `COMPONENTS_<NAME>` to the enum.
2. **`pages/routes/index.ts`** — add the route block:
   ```ts
   [RouteKey.COMPONENTS_<NAME>]: {
     path: `${componentsBasePath}/<name>`,
     public: true,
     pageComponent: <Name>PrototypePage,
     title: '<Name> UX Prototype',
     excludeFromMainNavbar: true,
     devOnly: true,
   },
   ```
3. **`pages/dev/index.ts`** — add a `componentCategories` entry so it shows in the dev catalogue.

Add a small persistent banner in the shell (e.g. "UX prototype — mock data only, nothing is saved")
so no one mistakes it for the real thing.

## Faithful mock data

- Mirror real field names and shapes (`publicId`, `slug`, enums, validation) so the mapping is obvious.
- Make the data **internally consistent** — if the prototype computes something (totals, derived
  values, reachable conditions), the seed should be valid against those rules, and you should verify
  it (drive the UI, check the numbers).
- Cover the interesting cases: empty states, an inactive/draft record, the edge that exercises each
  branch. A prototype that only shows the happy path hides the hard UX questions.

## Verify visually

Drive the prototype in a browser (puppeteer or manual) and screenshot the key states. A prototype's
whole value is the visual/interaction truth — confirm layouts hold, nav works, and any simulated
logic produces the right numbers. (When using puppeteer: launch maximised, screenshot full-size.)

## Gates — every change

```bash
turbo typecheck --filter=@ffp/web      # or: npx tsc --noEmit -p tsconfig.json (from packages/web)
npx eslint src/pages/dev/<name> --max-warnings 0
```

Both must pass. Dev-only is not an excuse for warnings — the prototype shares the package's lint
config, and clean code here keeps the eventual extraction honest.

## Hand-off — capture what the prototype taught

A prototype's durable output is the **learning**, not the code. When done, write (or update) a
findings/handover doc under `.claude/local/notes/` capturing:

- What the prototype validated (with evidence — the states you drove, the numbers you checked).
- The product/engineering **decisions** it surfaced (the things only building it revealed).
- **Confirmed gaps** for the real build: missing component variants, validation rules, types,
  endpoints/contracts to scope, author-facing traps.
- A recommendation to **plan the real build pattern-aware**: map each surface onto existing FFP
  patterns (list-page `Table`+`useApiTable` → edit-page `ComposableForm`; `Handler → Service →
Repository` with RLS; query-key factories), reuse first, and where the new work surfaces a pattern
  shared with other domains, plan the refactor/extraction _as we go_ rather than copy-pasting a third
  instance.

## What "good" looks like

- Reads like it belongs in the app — same components, spacing, colours, nav idiom.
- Self-contained: deleting the `pages/dev/<name>/` dir + the 3 route edits removes it cleanly.
- Faithful: anything it simulates matches the real logic; mock data is internally consistent.
- Honest: a visible "prototype / mock data" banner; gates green; no dead code dressed up as real.
- Teaches the real build: the hand-off names the decisions, gaps, and reuse opportunities.

## Anti-patterns

- ❌ Importing `@ffp/core`/`@ffp/database`, or adding any network/query call.
- ❌ Hand-rolling raw `<table>`/`<input>`/`<button>` when `Table`/`FormTextInput`/`Button` exist.
- ❌ Hard-coded greys/hex (theme colours only; gradients and the odd structural `#fff` aside).
- ❌ Co-locating helper components in one file (one component per file, always).
- ❌ Leaking the prototype into real navigation, or omitting `devOnly`/`excludeFromMainNavbar`.
- ❌ Planning jargon or `.claude/local` links inside the tracked prototype files.
- ❌ Treating "throwaway" as licence for lint warnings, dead code, or an inconsistent mock.
