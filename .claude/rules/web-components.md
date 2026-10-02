---
paths:
  - 'packages/web/**'
---

# Contract: FFP web UI

Loads when editing the web package. The `frontend` skill carries the fuller guidance.

## Must hold

- **Use existing components, never raw HTML** when one exists: `FormTextInput`, `FormSelect`, `FormToggle` (on/off switch for a boolean field), `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `ListEmptyState` (the two-branch empty state every admin list table uses), `EmptyState` (the dashed card for an empty section inside a page), `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`, `ConfirmModal` (the frame every confirm-a-destructive-action modal composes). A field's guidance goes in its `hint` prop (`FormTextInput`, `FormSelect`), which `aria-describedby` ties to the control, not in a `Text` placed under it; a validation message outside `FormField` renders the `FieldError` atom. Ask before adding a new component variant.
- **Atomic design for new UI.** A raw interactive element (`button`, `input`, `select`, a `role="switch"` and the like) lives in exactly one primitive, and everything else composes it. New primitives go in `components/atoms/<Name>/` (`Switch` is the first); molecules such as `FormToggle` combine atoms with labels and form wiring. When you build something reusable, replace the existing copies with it in the same change. The older per-element folders (`button/`, `text/`, `Icon/`, `select/`) move into `atoms/` in a later migration; do not move them piecemeal.
- **One component per file** — extract helper components to their own files, never co-locate.
- **Theme colours only**, never hard-coded greys: `foreground`, `muted-foreground`, `primary`, `secondary`, `success`, `destructive`, `warning`, `info`. Opacity via `bg-primary/10`, `border-destructive/20`. (Exceptions: gradients, structural layout.)
- **Themed text components**, not raw `<h1>`–`<h5>`/`<p>`/`<span>`/`<button>`.
- React components as **arrow functions** with `React.FC` typing — never function declarations.
- Server state via TanStack Query hooks (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`); `ffpClient` + `parseApiResponse` + Zod schema validation; hierarchical `as const` query-key factories.
- **Seed a query-backed form with `values`; a standalone create form with `defaultValues`.** `ComposableForm` re-seeds from `values` whenever the query changes, keeping fields the user has edited; a standalone create form's static constant has nothing to re-seed from. The shell's create mode is the exception that proves it: it passes its module-level `emptyValues` through `values`, which is harmless because an unchanged value never re-seeds. An `AdminEditPageShell` page hands the shell its `record`, a module-level `emptyValues` and `toFormValues`, and `onCreate` / `onUpdate` handlers that await `mutateAsync` (not `mutate`) so the guarded form knows when the save has landed; the shell derives the values and picks the handler. `useSaveFeedback` supplies those handlers' success toast and `submitError`.
- **Admin list pages render `AdminListPageShell`**: it owns `useApiTable`, the header, the table and its controls, and sends the search plus each configured filter to the page's list query. A soft-deletable record's deactivate-with-confirmation and activate go through `useActivationActions`; boolean active/inactive lists share `ACTIVE_STATUS_MAP`, `ACTIVE_STATUS_FILTER` and `toActiveStatus` from `components/table`.
- Import from `@ffp/core` only — **never** `@ffp/database`.
- British English in FFP code/strings (Tailwind classes and library APIs exempt). No emojis.

## Pattern

List page (`AdminListPageShell`) → Edit page (`AdminEditPageShell` + inline preview). Read 2–3 existing equivalents before building a new page.
