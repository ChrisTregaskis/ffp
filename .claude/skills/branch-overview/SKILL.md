---
name: branch-overview
description: Author or refresh the rolling visual branch summary at .claude/local/hub/branch-overview.html — a page that lets the user understand and review a finished branch themselves, with illustrated mechanism diagrams, a change tree, evidence and verification steps. Use when an implementation is complete and its review has been actioned, and a branch overview is asked for.
---

# Branch Overview — the page you hand over instead of a diff

## Overview

`.claude/local/hub/branch-overview.html` is a **rolling** page in the Working Docs Hub: one branch at a time, replaced in place, exactly like `review-context.md`, `review-comments.md` and `commit.md`. It exists so the user can understand a finished branch and review it themselves without reading the diff cold — mechanism first, then what changed, then proof, then steps he can run.

**When it is asked for:** implementation done, review done, review findings actioned or declined with reasons. Not mid-implementation — a page describing work still moving needs rewriting rather than reading. It is requested, never volunteered.

**What it is not:** a changelog, a completion summary, or a copy of `review-comments.md`. It is a reading aid for a reviewer who has the code in front of them.

This skill covers the page's own shape. **The hub's mechanics — the shell, `nav.js`, `HUB_ROOT`, the no-`fetch` rule — belong to the `hub-page` skill; read it first and do not restate it here.** This page sits at the hub root, so `HUB_ROOT = ''` and its assets are `assets/…`.

---

## Core concepts

### One nav entry, replaced not accumulated

A single `Branch Overview` group pinned **above** `Epic Roadmap` in `assets/nav.js`, holding one item named for the branch's subject with `note: 'in flight'`:

```js
{
  /* the branch in flight — replaced in place each time, like review-comments.md */
  title: 'Branch Overview',
  items: [{ label: 'Question bank admin API', path: 'branch-overview.html', note: 'in flight' }],
},
```

When a new branch needs a page, **overwrite the file and relabel the item.** Do not accumulate per-branch pages — the value is that there is one place to look, and an archive of stale branch pages is worse than none.

### Prose runs the full column

The hub's shared `header.intro p` carries a `max-width` suited to an essay. This page is scanned, and a 68ch measure leaves half the width empty beside a wide diagram. Override it, page-locally:

```css
/* Prose runs the full column here — this is a scanning page, not an essay,
   and a 68ch measure leaves half the width empty beside a wide diagram. */
header.intro p,
.bo-step p,
.bo-none,
.bo-lede {
  max-width: none;
}
```

Leave the measure **on** narrow elements — `.bo-note` cards are ~300px and need it.

### Bespoke class names, always prefixed

The shared stylesheet owns `.page`, `.card`, `.lane`, `.tag`. Reusing any of those for something structurally different collides. Prefix everything page-local: `bo-*` for layout, `d-*` for SVG paint. **Do** reuse the shared lane/card template where the content genuinely is a lane of cards — it is the right shape for a grouped list, and it brings the tint modifiers and the auto-dim on `.tag.cond` with it.

---

## The five sections

Order matters: mechanism before inventory, and steps last so they are the thing nearest the bottom of the scroll.

| #   | Section                | Carries                                                                                |
| --- | ---------------------- | -------------------------------------------------------------------------------------- |
| 1   | **The shape of it**    | A diagram of the mechanism, plus three or four short note cards                        |
| 2   | **A turn's journey**   | A flow diagram with the decision branches and every way out                            |
| 3   | **What changed**       | A colour-marked file tree, one line of _why_ per file                                  |
| 4   | **Evidence**           | Screenshots when there is a visual surface; terminal and server logs when there is not |
| 5   | **Verify it yourself** | Numbered steps, each a command plus what to expect back                                |

Plus a header (title, one-paragraph framing, a chip strip of facts) and one `.banner` if there is a single thing he must know before reading — _"ships switched off"_, _"needs VPN"_.

### What earns a place, and what does not

- **No review section.** It duplicates `review-comments.md`, which is where findings live and where their dispositions are recorded. Say what landed, not how it was found.
- **Evidence stays even when screenshots do not apply.** A branch with no visual surface still has proof — log lines, measured figures, a real reply from a live agent. Say plainly that there are no screenshots and why, then give the terminal evidence. An empty gallery is worse than a sentence.
- **Screenshots of the FFP web app** go in a sibling folder (`branch-assets/`) referenced with a page-relative `src`. Drive Chromium with `defaultViewport: null` and `--start-maximized` and capture at full size — the default small viewport renders the admin tables into a narrow box and the screenshot proves nothing.
- **Gate output counts as evidence.** `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` each produce a line worth quoting; the test total belongs in the facts strip.
- **A decision that reverses a documented one earns a card**, with its number. That is the thing a reviewer most needs and least expects.
- **Refactors go in the tree, not in a card.** A code-shape change with no behaviour change is a tree line with a why; giving it a card dilutes the mechanism story.

### The facts strip

Six or so chips under the title, so the whole state reads at a glance. Green (`.pass`) for the ones that are good news:

```html
<div class="bo-facts">
  <span class="bo-fact"><b>feature/assessment-question-admin-api</b></span>
  <span class="bo-fact">off <b>main</b></span>
  <span class="bo-fact">2 commits · <b>reviewed twice</b></span>
  <span class="bo-fact pass">four gates <b>green</b></span>
  <span class="bo-fact pass"><b>698</b> tests</span>
  <span class="bo-fact">validated <b>2026-09-19</b></span>
</div>
```

---

## Diagrams

The diagrams are why the page beats prose: they build the mental model. Load the **`artifact-diagramming`** skill for how to make one earn its place, then apply the hub's own paint.

### Two that work

1. **The mechanism** — the components, what flows between them, and the boundary the change is about. Label the arrows with verbs or states, not "related somehow". Give the one meaningful boundary a distinct colour and a label.
2. **The journey** — a vertical spine of the happy path with every exit branching right. This is where a reader learns the _ordering_, which is usually the part prose fails to convey.

### Paint from the hub's tokens, via classes

Presentation attributes cannot read CSS custom properties, so drive the SVG from page-local classes:

```css
.d-box {
  fill: var(--bg);
  stroke: var(--rule);
}
.d-box-key {
  fill: var(--blue-bg);
  stroke: var(--blue-border);
  stroke-width: 1.5;
}
.d-box-stop {
  fill: var(--red-bg);
  stroke: var(--red-border);
}
.d-box-go {
  fill: var(--green-bg);
  stroke: var(--green-border);
  stroke-width: 1.5;
}
.d-line {
  fill: none;
  stroke: var(--ink-muted);
  stroke-width: 1.25;
}
.d-border {
  fill: none;
  stroke: var(--rust);
  stroke-dasharray: 5 4;
}
.d-t {
  font-family: var(--mono);
  font-size: 12px;
  fill: var(--ink);
}
.d-t-sm {
  font-family: var(--mono);
  font-size: 10.5px;
  fill: var(--ink-muted);
}
```

Arrowheads are `<defs><marker>` with a literal `fill` (a marker cannot inherit the referencing element's class), one per colour. Wrap each in `<figure class="bo-fig">` with a `<figcaption>` stating the claim, and give the `<svg>` `role="img"` plus an `aria-label` carrying the same claim.

### The mechanics that will bite you

- **Serve it and look at it.** The Chrome extension cannot open `file://`, so `cd .claude/local/hub && python3 -m http.server 8777 --bind 127.0.0.1` and drive `http://127.0.0.1:8777/…`. Add a cache-buster (`?v=2`) after edits — the browser will happily serve you the previous version and you will "fix" things that are already fixed.
- **Labels collide in ways you cannot see unrendered.** Text crossing a riser, a sub-line overflowing its box, an arrow stopping short of the boundary it is meant to cross. Every one of those shipped in a first draft and was caught only by looking.
- **Prettier reflows SVG attributes across lines.** A patch matching `x="518"` on one element silently misses the two it wrapped. **Edit whole `<svg>` blocks, or assert every replacement landed.**
- **Give a label room, or shorten it.** A 34px stem cannot hold an eleven-character word. Move the geometry or cut the label and put the full term in the caption.

---

## The file tree

A `<pre class="bo-tree">` with `A`/`M` markers and a one-line reason per file. The reason is the point — a bare tree is `git status` with extra steps.

```html
<pre class="bo-tree">
<span class="dir">packages/core/src/assessments/</span>
├── <span class="a">A</span> <span class="dir">admin/</span>
│   ├── question-admin.service.ts   <span class="why">orchestrates the six per-type refinements</span>
│   └── question-admin.schema.ts    <span class="why">one Zod schema per question type, discriminated</span>
└── <span class="m">M</span> question.repository.ts     <span class="why">findByPublicId; deactivate rather than delete</span>
</pre>
```

`.why` renders a `· ` prefix via `::before`. Group by package (`@ffp/database` → `@ffp/core` → `@ffp/functions` → `@ffp/web`, the dependency order), collapse siblings that share a reason onto one line (`shapes.ts, candidates.ts, floors.ts`), and do not list every test file — say what the tests cover on the directory line.

**Count files with `--untracked-files=all`.** `git status --short` collapses an untracked directory to one entry, which under-counts a branch that added a folder:

```bash
M=$(git status --short | grep -c '^ M')
N=$(git status --short --untracked-files=all | grep -c '^??')
echo "modified $M  new $N  total $((M+N))"
```

---

## Verification steps

Six or so `.bo-step` list items, each: a heading, one or two sentences of _why this step matters_, the command, and a green `.bo-expect` block showing what comes back. The expected output is what makes the step checkable without judgement.

```html
<li class="bo-step">
  <h3>A non-admin cannot write to the catalogue</h3>
  <p>
    The catalogue tables sit outside RLS, so the <code>system_admin</code> gate is the only thing
    standing between a programme user and every organisation's questions.
  </p>
  <pre class="bo-cmd">
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/admin/questions" -H "Authorization: Bearer $PROGRAMME_USER_ID_TOKEN" -H 'Content-Type: application/json' -d '{"slug":"nope","type":"single_choice"}'</pre
  >
  <pre
    class="bo-expect"
  ><b>expect</b>403   <span class="c">← refused by the role gate, not a 500</span></pre>
</li>
```

Two rules for the steps:

- **They must actually run.** Run every one against a live server before handing the page over, and fix the page where reality differs. A step that a reader runs and sees something else from costs more trust than no step at all.
- **Say where a step cannot prove something.** If a path is only reachable in the suite — a tenant fixture the dev tenant lacks, a stalled process, event-loop lag — say so in the step rather than implying the curl covers it.

### Running an FFP step against the live API

The deployed dev API proxies to a local worker, so **`pnpm sst:dev` must be running** in the ops pane or every call comes back "sst dev is not running". Then:

- **Base URL** — `apiUrl` from `.sst/outputs.json`.
- **Credentials** — `.claude/local/notes/logins-for-local.json` holds throwaway local-dev users keyed by role (System Admin, Customer Admin, Programme User). Use them rather than asking.
- **Token** — `POST {api}/auth/login` with `{ "email", "password" }`, then send the **`idToken`** as `Authorization: Bearer …`. The `custom:role` claim the `system_admin` gate reads lives in the idToken, not the accessToken.
- **Keep tokens in-session only.** Never write one into the page, a note, or a committed file.

A multi-tenant branch earns at least one step that proves **isolation**, not just that the happy path works: the same request under a second organisation's token returning 403 or an empty set is the evidence a reviewer actually wants.

---

## Keeping it true

The page went stale three times inside one session. Counts, test totals and file numbers move with every change, and a wrong number on a page built for trust is worse than a missing one.

- Refresh the facts strip **and** the `<span class="aside">` in each section heading — they duplicate the same figures and drift apart.
- Re-run the counting command rather than adjusting the old number by hand.
- When the branch is committed, swap the "uncommitted · N files" chip for something durable (`2 commits · reviewed twice`) so the page stops needing a file count at all.

---

## Common pitfalls

| Pitfall                                               | Fix                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Writing it mid-implementation                         | Wait until the work and its review are both done — it is requested, not volunteered |
| A review section                                      | Findings live in `review-comments.md`; the page says what landed                    |
| Hard-wrapping the prose                               | One paragraph per line; override the shared `max-width` page-locally                |
| Reusing `.card` / `.tag` / `.page` for something else | Prefix bespoke classes `bo-*` and `d-*`                                             |
| Shipping a diagram unrendered                         | Serve it, screenshot it, look at it — with a cache-buster                           |
| Patching SVG attributes by string match               | Prettier has reflowed them; edit whole `<svg>` blocks                               |
| A bare `git status --short` count                     | Collapses untracked directories; use `--untracked-files=all`                        |
| Verification steps that were never run                | Run all of them against a live server first                                         |
| Accumulating a page per branch                        | One rolling page, relabelled in `nav.js`                                            |

---

## Conventions

- **British English** in content (colour, behaviour, catalogue, organise, licence).
- **No `fetch`, CDN, build step or ES-module import** — relative, self-contained assets only, per `hub-page`.
- **Light only.** No `prefers-color-scheme` flip; the hub's `:root` palette is the palette.
- The `⚠`-free rule applies to **code comments**, not to this page — a banner or a diagram may use a glyph where it earns its place.
- It is a personal working tool: gitignored from the project, synced to HQ via the `.claude/local` symlink. Git history writes stay the user's.

## Related

- `hub-page` — the hub's shell, `nav.js`, `HUB_ROOT` and the `file://` rules. Read first.
- `artifact-diagramming` — when a picture earns its place, and how to draw the mechanism rather than its name.
- `full-review` / `review` / `bug-review` — produce `review-comments.md`, which this page deliberately does not repeat.
- `.claude/local/notes/review-context.md` — the reviewer brief written by the implementation session. The overview complements it: the brief says what to look at, the page shows how it works.
- `smoke-test` — the E2E verification command; a smoke-test run is good material for the Evidence section.
