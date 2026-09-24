---
paths:
  - 'packages/**'
---

# Contract: entity identifiers

Loads when editing any package. Every URL-facing table carries two identifiers, and which one an endpoint resolves by is not uniform across the codebase — the mismatches that causes are a recurring source of live bugs, so check before you wire a call.

## The two identifiers

| Identifier | Shape               | Where it belongs                                                      |
| ---------- | ------------------- | --------------------------------------------------------------------- |
| `id`       | UUID primary key    | Foreign keys, joins, and any endpoint that resolves by `id`           |
| `publicId` | 12-character nanoid | Browser URLs, route parameters, and any endpoint keyed on `public_id` |

**Never put a UUID in a URL.** Routes navigate with `publicId`, so `useParams()` always hands back a `publicId` — whatever the parameter happens to be called. Several routes name it `:id`; that name is historical and does not mean the value is a UUID.

## The target shape

**`publicId` on both sides** — the read and every write on the same resource keyed alike — for anything URL-facing. Assessment flows and flow steps are the worked example: `GET`, `PUT`, `DELETE` and reorder all resolve by `publicId`, so a page can pass its route parameter straight through and nothing can drift.

## What is actually in the codebase

Four conventions are in use. Read the service before wiring a call:

| Resource                                            | Read                                    | Writes     | Note                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assessment flows, flow steps                        | `publicId`                              | `publicId` | The target shape                                                                                                                                          |
| Locations, organisations, users                     | `publicId`                              | UUID       | Split — the page must pass the UUID from the fetched record                                                                                               |
| Programme templates (+ phases, sessions, exercises) | `publicId` (template) / UUID (children) | UUID       | Split; the children have no `publicId` at all                                                                                                             |
| Videos                                              | `publicId`                              | UUID       | Split. The **signed-URL** endpoint alone accepts either form, matching `id` or `public_id` in one query — deliberately permissive, and not to be narrowed |

## Must hold

- **A page fetches by `publicId` and writes by whatever the endpoint resolves.** Where they differ, read the UUID off the fetched record — never pass the route parameter to a UUID-keyed write:

  ```typescript
  const { data: location } = useLocationDetailQuery(id ?? ''); // id is a publicId
  // The route carries a publicId; this endpoint resolves by UUID
  updateMutation.mutate({ id: location.id, publicId: location.publicId, data: payload });
  ```

  **Send the `publicId` too, for the cache.** The detail query is registered under the `publicId`, so a mutation that invalidates by UUID silently matches nothing and the stale record survives its `staleTime`. Every split resource's update variables therefore take both: the UUID the endpoint resolves, and the `publicId` the query key is built from.

- **Guard UUID-keyed path parameters at the API client** with `assertUuidPathParam` (`packages/web/src/lib/api/client/`). Postgres only rejects the wrong shape when the value reaches the comparison, which surfaces as an opaque 500 (`22P02`, shown as "Database driver error") with nothing naming the caller.

- **The guard covers path parameters only — body fields have the same failure mode and are on you.** `videoId` on `POST /admin/sessions/{sessionId}/exercises` and `PUT /admin/exercises/{exerciseId}` resolves by UUID (`findVideoById`), so a publicId sent in the body produces the identical opaque 500 with nothing guarding it. Check a body identifier by hand against the column the service compares it to.

- **Never guard an endpoint keyed on `publicId`, or one that accepts either form.** The assertion would be a false constraint, and the permissive video lookup exists on purpose.

- **A response that displays a related record's name carries that name.** Joining it into the read — `user.locationName`, `location.organisationName` — beats a second dependent query on the page: the form seeds its default values once on mount, so a name that arrives on a later render is never picked up.
