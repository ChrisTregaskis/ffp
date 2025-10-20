# Services

Service layer implementations will be added here as part of future stories.

## Structure

Services contain business logic and orchestrate data access through repositories.

```
services/
├── auth.service.ts        # Authentication business logic
├── assessment.service.ts  # Assessment processing
├── program.service.ts     # Program generation
└── user.service.ts        # User management
```

## Coming in:

- FFP-9: Cognito Authentication
- FFP-10: PostgreSQL Schema with RLS
- Future stories: Assessment Engine, Program Generation
