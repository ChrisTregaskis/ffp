---
paths:
  - 'packages/web/**'
---

# Contract: FFP web UI

Loads when editing the web package. The `frontend` skill carries the fuller guidance.

## Must hold

- **Use existing components, never raw HTML** when one exists: `FormTextInput`, `FormSelect`, `FormToggle` (on/off switch for a boolean field), `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `ListEmptyState` (the two-branch empty state every admin list table uses), `EmptyState` (the dashed card for an empty section inside a page), `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`, `ConfirmModal` (the frame every confirm-a-destructive-action modal composes). A field's guidance goes in its `hint` prop (`FormTextInput`, `FormSelect`), which `aria-describedby` ties to the control, not in a `Text` placed under it; a validation message outside `FormField` renders the `FieldError` atom. Ask before adding a new component variant.
- **Atomic design.** Every component has a level. An **atom** wraps one raw element or primitive (`button`, `input`, `textarea`, a checkbox, a `role="switch"`, text, an icon) and is the only place that element is rendered. A **molecule** combines a few atoms for one job (a labelled field, a badge with an icon). An **organism** is a self-contained section, often stateful or data-aware (a table, a modal, a domain form's fields). A **template** is a page skeleton with slots (`AppLayout`, `AdminListPageShell`, `AdminEditPageShell`). Pages stay in `pages/`.
  - **Generic components live in their level folder:** `components/{atoms,molecules,organisms,templates}/<Name>/<Name>.tsx` plus an `index.ts`. The folder declares the level. A component's private parts may sit in its folder, one component per file, unexported from its `index.ts`.
  - **Domain components** (`assessment/`, `programme-templates/`, `video/`, …) stay in their domain folder and are molecules or organisms composed from the level folders. A domain component that turns out to be an atom, or is needed outside its domain, moves to its level folder.
  - **Imports point down.** Atoms import no other level; molecules import atoms; organisms import molecules and atoms; templates import any level; a level folder never imports a domain folder. Import from the level barrel (`@web/components/atoms`); a component never imports its own level's barrel (use the sibling's path).
  - `motion/` (behaviour wrappers), `error/` (`ErrorBoundary`) and `dev/` / `demo/` (scaffolding for `pages/dev`) sit outside the levels. Shared non-visual helpers (input styles, field ids and error lookup) live in `utils/`, where any level may import them.
  - Before building, look for the atom or molecule that already does the job. When you build something reusable, replace the existing copies in the same change. Older code moves to the level folders in deliberate migrations, not piecemeal or as a drive-by.
- **One component per file** — extract helper components to their own files, never co-locate.
- **Theme colours only**, never hard-coded greys: `foreground`, `muted-foreground`, `primary`, `secondary`, `success`, `destructive`, `warning`, `info`. Opacity via `bg-primary/10`, `border-destructive/20`. (Exceptions: gradients, structural layout.)
- **Themed text components**, not raw `<h1>`–`<h5>`/`<p>`/`<span>`/`<button>`.
- React components as **arrow functions** with `React.FC` typing — never function declarations.
- Server state via TanStack Query hooks (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`); `ffpClient` + `parseApiResponse` + Zod schema validation; hierarchical `as const` query-key factories.
- **Seed a query-backed form with `values`; a standalone create form with `defaultValues`.** `ComposableForm` re-seeds from `values` whenever the query changes, keeping fields the user has edited; a standalone create form's static constant has nothing to re-seed from. The shell's create mode is the exception that proves it: it passes its module-level `emptyValues` through `values`, which is harmless because an unchanged value never re-seeds. An `AdminEditPageShell` page hands the shell its `record`, a module-level `emptyValues` and `toFormValues`, and `onCreate` / `onUpdate` handlers that await `mutateAsync` (not `mutate`) so the guarded form knows when the save has landed; the shell derives the values and picks the handler. A page that only edits leaves out `isEditMode`, `emptyValues` and `onCreate` together (the types refuse a partial set). Content above the form but outside it, such as a preview or a summary card, goes in `beforeForm`. A save that asks for confirmation first returns a promise the modal settles exactly once, held in a ref so a click during the modal's exit animation cannot settle it again; `VideoEditPage`'s archive is the worked example. `useSaveFeedback` supplies those handlers' success toast and `submitError`; its `mapError` option rewords a failure the form should explain differently, such as a 409 for a taken slug.
- **Admin list pages render `AdminListPageShell`**: it owns `useApiTable`, the header, the table and its controls, and sends the search plus each configured filter to the page's list query. A soft-deletable record's deactivate-with-confirmation and activate go through `useActivationActions`; boolean active/inactive lists share `ACTIVE_STATUS_MAP`, `ACTIVE_STATUS_FILTER` and `toActiveStatus` from `@web/components/organisms`.
- Import from `@ffp/core` only — **never** `@ffp/database`.
- British English in FFP code/strings (Tailwind classes and library APIs exempt). No emojis.

## Pattern

List page (`AdminListPageShell`) → Edit page (`AdminEditPageShell` + inline preview). Read 2–3 existing equivalents before building a new page.
