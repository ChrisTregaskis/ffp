# Functions

Lambda function handlers for FFP API endpoints.

## Structure

```
functions/
├── auth/              # Authentication endpoints (FFP-9)
│   ├── register.ts
│   ├── login.ts
│   └── refresh.ts
├── assessments/       # Assessment CRUD (Future)
├── programs/          # Program generation (Future)
├── videos/            # Video metadata (Future)
└── business/          # Business portal logic (Future)
```

## Coming in:

- FFP-9: Cognito Authentication handlers
- Future stories: Assessment, Program, Video endpoints

## Current Status

- ✅ Package structure created
- ⏸️ Awaiting FFP-8 (SST Infrastructure)
- ⏸️ Awaiting FFP-9 (Auth handlers implementation)
