# Repositories

Data access layer with RLS-aware database queries.

## Structure

Repositories handle all database interactions with proper multi-tenant isolation.

```
repositories/
├── user.repository.ts       # User CRUD with RLS
├── tenant.repository.ts     # Tenant CRUD
├── assessment.repository.ts # Assessment data access
└── program.repository.ts    # Program data access
```

## Coming in:

- FFP-10: PostgreSQL Schema with RLS
- FFP-11: Drizzle ORM Setup
- Future stories: Full repository implementations
