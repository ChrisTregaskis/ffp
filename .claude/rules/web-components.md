---
paths:
  - 'packages/web/**'
---

# Contract: FFP web UI

Loads when editing the web package. The `frontend` skill carries the fuller guidance.

## Must hold

- **Use existing components, never raw HTML** when one exists: `FormTextInput`, `FormSelect`, `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `ListEmptyState` (the two-branch empty state every admin list table uses), `EmptyState` (the dashed card for an empty section inside a page), `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`. Ask before adding a new component variant.
- **One component per file** — extract helper components to their own files, never co-locate.
- **Theme colours only**, never hard-coded greys: `foreground`, `muted-foreground`, `primary`, `secondary`, `success`, `destructive`, `warning`, `info`. Opacity via `bg-primary/10`, `border-destructive/20`. (Exceptions: gradients, structural layout.)
- **Themed text components**, not raw `<h1>`–`<h5>`/`<p>`/`<span>`/`<button>`.
- React components as **arrow functions** with `React.FC` typing — never function declarations.
- Server state via TanStack Query hooks (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`); `ffpClient` + `parseApiResponse` + Zod schema validation; hierarchical `as const` query-key factories.
- **Seed an edit form with `values`, a create form with `defaultValues`.** `ComposableForm` re-seeds from `values` whenever the query changes, keeping fields the user has edited; a static constant has nothing to re-seed from. A page whose form sets `guardUnsavedChanges` (every `AdminEditPageShell` page) returns its save's promise from `onSubmit` — `mutateAsync`, not `mutate` — so the form knows when the save has landed.
- Import from `@ffp/core` only — **never** `@ffp/database`.
- British English in FFP code/strings (Tailwind classes and library APIs exempt). No emojis.

## Pattern

List page (`Table` + `TableControls` + filters) → Edit page (`ComposableForm` + inline preview). Read 2–3 existing equivalents before building a new page.
