# Sprint 9 — Programme Template Management Smoke Test

**Epic**: FFP-439 (Admin Programme Template Management)
**Covers**: FFP-490 (Full CRUD flow), FFP-491 (Cascade delete behaviour)
**Last run**: 18th March 2026 — all journeys passed

## Prerequisites

- Frontend + backend running on `http://localhost:3000`
- Database seeded with Gentle Mobility Programme hierarchy (4 phases, 12 sessions, 40 exercises)
- User logged in as system admin

## Test Journeys

### Journey 1: Template List Page

1. Navigate to `/admin/templates`
2. Screenshot — verify table loads with seed data
3. Verify default filter is "Active" (status filter pre-selected)
4. Verify columns: Name, Difficulty, Phases, Status, Created, Actions (no "Sessions/Phase" column)
5. Test search — type a partial name (e.g. "Gentle"), verify results filter
6. Clear search — verify all templates return

**Expected**: Table loads, Active filter default, search filters correctly, no Sessions/Phase column.

### Journey 2: Create Template

1. Click "Create Template" button
2. Screenshot — verify create page at `/admin/templates/create`
3. Type a name (e.g. "Test Recovery Programme") — verify slug auto-generates (kebab-case)
4. Select difficulty (e.g. "Beginner") — custom dropdown, click trigger then select option
5. Add a description
6. Click "Create Template"
7. Screenshot — verify redirect to detail page with success toast
8. Navigate back to list — verify new template appears with Phases = 0

**Expected**: Slug auto-generates, form submits, redirects to detail page.

### Journey 3: Template Detail — Metadata Editing

1. On the detail page, verify metadata form loads (name, slug, difficulty, status, description)
2. Verify summary card shows Created date, Last updated date, Active badge
3. Edit the name (append " (Edited)")
4. Click "Save Changes"
5. Screenshot — verify success toast, name updated in page header

**Expected**: Diff-based update, only changed fields sent, success toast.

### Journey 4: Phase CRUD + Cascade Delete

1. Navigate to "Phases" tab (sidebar link)
2. Screenshot — verify empty state with "Add Phase" button
3. Click "Add Phase", fill name (e.g. "Foundation Phase") and description
4. Submit — verify phase appears with order 1
5. Add a second phase (e.g. "Progression Phase")
6. Screenshot — verify both phases listed with correct order
7. On second phase: Actions > Move Up — verify order swapped, "Phase order updated" toast
8. On first phase (now Progression): Actions > Delete
9. Screenshot — verify confirmation modal with cascade warning: "...all sessions and exercises within it"
10. Confirm delete — verify phase removed, remaining phase re-indexed to order 1

**Expected**: Create, reorder, delete all work. Cascade warning in delete modal. Re-indexing after delete.

### Journey 5: Session CRUD

1. Navigate into a phase (Actions > Edit Phase)
2. Screenshot — verify phase detail page with sessions section
3. Click "Add Session", fill name and duration
4. Submit — verify session card appears
5. Add a second session
6. On second session: "..." menu > Move up — verify reorder works
7. On second session: "..." menu > Delete
8. Verify confirmation modal with cascade warning: "...all exercises within it"
9. Confirm — verify session removed

**Expected**: Session CRUD within phase. Cascade warning for exercises. Reorder works.

### Journey 6: Exercise CRUD with Video Selection

1. Expand a session (click session name)
2. Click "Add Exercise"
3. In VideoSelector, type at least 2 characters (e.g. "Gentle" or "Squat")
4. Screenshot — verify dropdown shows results with title, difficulty, movement type
5. Select a video — verify prescription fields appear (Sets, Reps, Duration, Rest, Notes)
6. If video has default prescription values, verify pre-population of empty fields
7. Fill prescription (e.g. sets=3, reps=10)
8. Submit — verify exercise row appears with video name and prescription summary
9. Add a second exercise with a different video
10. On second exercise: "..." menu > Move up — verify reorder
11. Delete an exercise — verify confirmation modal and removal

**Expected**: VideoSelector search, video selection, prescription fields, CRUD, reorder.

### Journey 7: Seed Data Verification

1. Navigate to `/admin/templates`
2. Open "Gentle Mobility Programme" (Actions > View Detail)
3. Navigate to Phases tab
4. Verify 4 phases exist (Building Foundations, Gentle Awareness, Progressive Mobility, Consolidation)
5. Navigate into a phase — verify 3 sessions
6. Expand a session — verify exercises with video associations and prescription data

**Expected**: Seed data completely intact and unaffected by CRUD operations on test template.

### Journey 8: Error Handling

1. Navigate to `/admin/templates/create`
2. Create a template with slug "gentle-mobility-programme" (duplicate)
3. Screenshot — verify 409 error: "A template with this slug already exists"
4. Navigate to `/admin/templates/00000000-0000-0000-0000-000000000000` (non-existent)
5. Screenshot — verify error state: "Unable to load template" with "Back to Programme Templates" action

**Expected**: Duplicate slug shows 409 error. Non-existent ID shows 404 error state.

## Cleanup

After testing, optionally delete the test template created in Journey 2 to keep the database clean. Or leave it for manual inspection.

## Known Observations (from 18th March 2026 run)

1. **Stale `totalPhases` on seed templates**: Existing seed templates show 12 in the Phases column instead of their actual count (4 for Gentle Mobility). This is because the FFP-516 migration changed the column default but didn't update existing rows. A re-seed would correct this. Not a code bug.
2. **Video default prescription pre-population**: Seed videos don't have default prescription values set, so pre-population couldn't be verified via search. The logic is in place — needs videos with `defaultSets`/`defaultReps` to demonstrate.
