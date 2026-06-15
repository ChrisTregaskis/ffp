---
paths:
  - 'packages/web/**'
---

# Contract: FFP web UI

Loads when editing the web package. The `frontend` skill carries the fuller guidance.

## Must hold

- **Use existing components, never raw HTML** when one exists: `FormTextInput`, `FormSelect`, `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`. Ask before adding a new component variant.
- **One component per file** — extract helper components to their own files, never co-locate.
- **Theme colours only**, never hard-coded greys: `foreground`, `muted-foreground`, `primary`, `secondary`, `success`, `destructive`, `warning`, `info`. Opacity via `bg-primary/10`, `border-destructive/20`. (Exceptions: gradients, structural layout.)
- **Themed text components**, not raw `<h1>`–`<h5>`/`<p>`/`<span>`/`<button>`.
- React components as **arrow functions** with `React.FC` typing — never function declarations.
- Server state via TanStack Query hooks (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`); `ffpClient` + `parseApiResponse` + Zod schema validation; hierarchical `as const` query-key factories.
- Import from `@ffp/core` only — **never** `@ffp/database`.
- British English in FFP code/strings (Tailwind classes and library APIs exempt). No emojis.

## Pattern

List page (`Table` + `TableControls` + filters) → Edit page (`ComposableForm` + inline preview). Read 2–3 existing equivalents before building a new page.
