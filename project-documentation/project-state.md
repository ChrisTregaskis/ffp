# FFP - Project State

**Last Updated**: November 17, 2025 - Session 51
**Current Phase**: Sprint 2 Execution - IN PROGRESS 🚀
**Sprint Duration**: 10th November - 30th November 2025 (3 weeks)
**Current User Story Branch:** `feature/FFP-16-web-login-flow`
**Next Subtask**: FFP-97 - Write Unit Tests for Login Flow
**Recently Completed**: FFP-92 - Implement Login Form (Complete with Code Review Fixes)

---

## Sprint 2 Overview

**Duration**: 10th November - 30th November 2025 (3 weeks)
**Focus**: Complete Application Setup (EPIC FFP-1) + Assessment Engine Planning

**Sprint 2 Stories**:

1. ✅ **FFP-9** - Cognito Authentication (COMPLETE)
2. ✅ **FFP-12** - Testing Infrastructure Setup (COMPLETE)
3. 🚀 **FFP-16** - Web Login Interface (IN PROGRESS - 7/10 subtasks active, 2 deferred)
4. **FFP-110** - Assessment Engine Epic Planning

**Sprint 1 Summary**:

- Completed: 6/10 stories (132.5/197 hours, 67%)
- Carried Over: FFP-9 (completed in Sprint 2)
- Deferred: FFP-14 (CloudWatch Monitoring)

---

## Completed Work: FFP-9 - Cognito Authentication

**Status**: ✅ COMPLETE (10/13 subtasks, 29/31-32 hours, 93%)

### Phase 1: Prerequisites (8h) - ✅ COMPLETE

- ✅ FFP-43: Error Handling Classes (3.5h)
- ✅ FFP-36: Tenant Context Extraction (2h)
- ✅ FFP-44: Structured Logging (2h)
- ⏸️ FFP-32: Secrets Manager (2.5h) - **DEFERRED** (see decisions below)

### Phase 2: Bootstrap + Core Auth (10.5h) - ✅ COMPLETE

- ✅ Manual: Super User Setup (0.5h)
- ✅ FFP-112: Admin API Endpoint (4.5h)
- ✅ FFP-35: Zod Schemas (3h)
- ✅ FFP-37: Invite User Lambda (4h)

### Phase 3: Authentication Endpoints (7h) - ✅ COMPLETE

- ✅ FFP-38: Login Lambda (3h)
- ✅ FFP-39: Refresh Token Lambda (2h)
- ✅ FFP-40: API Gateway Routes (1h)

### Phase 4: Testing (12h - focused on critical unit tests)

- ✅ FFP-41: Unit Tests (4h) - **COMPLETE** (context.ts tests + RLS fix)
- ⏸️ FFP-42: Integration Tests (5h) - **DEFERRED** (10% coverage target achieved with unit tests)
- ⏸️ FFP-45: Deployed Environment Tests (3h) - **DEFERRED** (will be addressed in FFP-12)

### Phase 5: Documentation (2h) - ✅ COMPLETE

- ✅ FFP-46: API Documentation (2h)

---

## Completed Work: FFP-12 - Testing Infrastructure Setup

**Status**: ✅ COMPLETE (4/11 subtasks completed, 7 deferred to post-MVP)

### Phase 1 Pragmatic Approach

**Completed** (Unit + RLS Testing):

- ✅ FFP-65: Vitest installed (`vitest@2.1.4`, `@vitest/ui@2.1.4`)
- ✅ FFP-66: Vitest configuration (root + package-specific configs)
- ✅ FFP-72: Sample unit tests (185 tests passing)
- ✅ FFP-71: Test helpers (database RLS helpers in `packages/database/__tests__/helpers.ts`)

**Deferred to Post-MVP** (Playwright/MSW):

- ⏸️ FFP-67: Install Playwright
- ⏸️ FFP-68: Create Playwright config
- ⏸️ FFP-69: Install MSW
- ⏸️ FFP-70: Configure MSW server/handlers
- ⏸️ FFP-73: Sample E2E test
- ⏸️ FFP-74: Sample MSW mock test
- ✅ FFP-75: Updated testing-strategy.md (reflects Phase 1 approach)

### Testing Infrastructure Summary

**Current State** (Phase 1):

- ✅ Vitest installed and operational
- ✅ 185 unit tests passing (core + database packages)
- ✅ 16 RLS integration tests (critical multi-tenant isolation)
- ✅ 10% coverage target achieved
- ✅ Test helpers for RLS testing
- ✅ Transaction rollback pattern (no database pollution)

**Rationale for Deferral**:

- Solo developer with 8h/week capacity
- Unit tests + RLS integration provide sufficient Phase 1 coverage
- E2E testing better suited for mature UI (after FFP-16)
- MSW adds complexity without clear benefit (Vitest mocks sufficient)
- Manual testing adequate for MVP validation

---

## Current Work: FFP-16 - Web Login Interface

**Status**: 🚀 IN PROGRESS (8/10 subtasks - 6 complete, 2 active, 2 deferred)
**Estimated**: ~18-19 hours (revised from 20 hours with deferrals)
**Completed**: 15/18-19 hours (79%)

### Execution Order

1. ✅ **FFP-115** - Component Library & Design System Setup (4h) - **COMPLETE**
2. ✅ **FFP-93** - Install and configure AWS Amplify (1h) - **COMPLETE**
3. ✅ **FFP-90** - Create AuthContext and AuthProvider (4h) - **COMPLETE**
4. ✅ **FFP-119** - Web Routing & Component Library Foundation (2h actual + 2h extended scope) - **COMPLETE**
5. ✅ **FFP-92** - Implement login form (2h) - **COMPLETE** (with code review fixes)
6. ✅ **FFP-95** - Implement logout functionality (1h) - **COMPLETE** (integrated with routing)
7. **FFP-97** - Write unit tests (2h) - 🔜 **NEXT**
8. **FFP-100** - Update documentation (1h)

### Deferred Subtasks

- **FFP-91** - Registration form (3h) - ⏸️ **DEFERRED** to Phase 2
  - Reason: Admin-only business onboarding (no self-registration in MVP)
  - Aligns with FFP-9 authentication strategy
- **FFP-98** - Integration tests (3h) - ⏸️ **DEFERRED** to post-MVP
  - Reason: Consistent with FFP-12 testing strategy
  - Unit tests (FFP-97) + manual testing sufficient for Phase 1
- **FFP-99** - E2E tests - ✅ **ALREADY ABANDONED** (Playwright deferred)

### Key Decisions

**Component Library First** (Session 44):

- Created new subtask FFP-115 for component library & design system
- MUST complete before form-based subtasks (FFP-90, FFP-92, FFP-96)
- Includes: Tailwind theme, Icomoon icons, Button, Form components
- Form pattern: Standard forms only (assessment forms deferred to Sprint 3)
- Component showcase page at `/components` route (public, no auth)

**Design System Setup**:

- Tailwind CSS with custom theme (colours, typography)
- Icomoon icon system with TypeScript type generation
- Reusable Button component (primary, secondary, text variants)
- Reusable form inputs (TextInput, PasswordInput, EmailInput)
- Form management pattern from guide (standard forms only)
- British English throughout

**Reference Documents**:

- Form pattern: `project-documentation/sprint-planning/outputs/Form Management Pattern Guide.md`
- Icon system: `project-documentation/sprint-planning/outputs/Icon System Implementation Guide.md`
- Executable prompt: `project-documentation/sprint-planning/prompts/FFP-115-component-library-prompt.md`

---

## Recent Work (Sprint 2 Sessions)

**Session 51 (Nov 17)**: ✅ FFP-92 - Implement Login Form COMPLETE (with Code Review Fixes)

**Login Form Implementation**:

- Created LoginForm organism component using config-driven form pattern
  - Uses Field[] configuration from loginFields (email + password)
  - Integrated with StaticAlert for error display
  - Password field configured with FieldDataType.PASSWORD for visibility toggle
  - Forgot password navigation to placeholder page
- Created reusable StaticAlert component for contextual feedback
  - Variants: error, warning, success with colour-coded backgrounds and icons
  - Dismissible functionality with IconButton integration
  - Accessible role="alert" for screen readers
- Extracted IconButton as reusable clickable icon component
  - Documented as low-level primitive (raw button acceptable)
  - Full accessibility with aria-label support
- Updated Button component secondary variant to outline style (border-2 border-primary)
- Refactored Form component to use Button component instead of raw HTML (15 lines → 3 lines)
- Added missing colour mappings to Text and Title components (warning, info)
- Created AuthLayout template component for consistent auth screen styling
  - Gradient background with logo and centered card layout
  - Documented gradient colour exception (acceptable for visual effects)
- Created ForgotPasswordPage placeholder with informative messaging
- Created comprehensive StaticAlertComponentsPage showcase (269 lines)
- All components use theme colours (no hard-coded colours except documented exceptions)
- Zero TypeScript errors, zero ESLint warnings
- British English spelling throughout
- Manual testing: Login, error display, forgot password navigation all verified

**Code Review & Fixes** (9 issues addressed):

1. ✅ Replaced raw button in HomePage with Button component
2. ✅ Fixed text colour inconsistency in logout button (automatic via Button)
3. ✅ Added documentation to IconButton about raw button usage
4. ✅ Updated password field to use FieldDataType.PASSWORD (enables visibility toggle)
5. ✅ Documented gradient colour exception in AuthLayout
6. ✅ Replaced hard-coded colours in dev pages with theme colours (bg-muted, bg-foreground)
7. ✅ Simplified AuthLayout by removing unused subtitle prop
8. ✅ Implemented type-safe routing with RouteKey enum in LoginPage
9. ✅ Implemented type-safe routing with RouteKey enum in ForgotPasswordPage

**Quality Verification**:

- ✅ TypeScript: Zero errors (strict mode)
- ✅ ESLint: Zero warnings (--max-warnings 0)
- ✅ Tests: All passing (2/2 in web package)
- ✅ Component usage: All raw HTML replaced with themed components
- ✅ Theme colours: All hard-coded colours replaced (except documented exceptions)
- ✅ Type-safe routing: RouteKey enum used throughout
- ✅ Security: JWT claims use correct custom: prefix

**Files Created** (7):

- packages/web/src/components/auth/LoginForm.tsx (82 lines)
- packages/web/src/components/auth/index.ts (36 lines)
- packages/web/src/components/feedback/StaticAlert.tsx (96 lines)
- packages/web/src/components/button/IconButton.tsx (51 lines)
- packages/web/src/components/layout/AuthLayout.tsx (57 lines)
- packages/web/src/pages/public/ForgotPasswordPage.tsx (74 lines)
- packages/web/src/pages/dev/StaticAlertComponentsPage.tsx (269 lines)

**Files Modified** (29):

- Button, Form, FormTextInput, FormError components refined
- Text, Title components enhanced with warning/info colours
- HomePage updated to use Button component
- LoginPage integrated with LoginForm and AuthContext
- AppLayout refinements
- Dev pages updated to use theme colours
- Routes and RouteKey enum extended
- Auth schemas added
- Code review instructions updated (raw HTML/hard-coded colour checks)
- FFP code review skill enhanced with component usage enforcement

**Ready for FFP-97** (Write Unit Tests)

---

**Sessions 49-50 (Nov 17)**: ✅ FFP-119 - Web Routing & Component Library Foundation COMPLETE (Extended Scope + Code Review)

**Extended Scope Implementation** (Session 49):

- Significantly expanded beyond basic routing to include comprehensive component library
- Created complete component library structure:
  - **Form System**: Config-driven Form, FormTextInput, useForm hook with field-level validation
  - **Icon Library**: 20+ icons with consistent size/colour props (ArrowLeft, CheckCircle, ChevronDown, LockClosed, UserCircle, etc.)
  - **UI Components**: Text, Title, Card, LoadingSpinner, Logo with size/weight/colour variants
  - **Motion System**: FadeIn, SlideIn, Scale animation wrappers using Framer Motion
  - **Layout Components**: PageContainer, PageHeader for consistent page structure
  - **Dev Components**: ComponentShowcase, CodeExample, VariantDemo for demonstrations
- Created comprehensive component showcase pages:
  - ComponentsPage - Landing with category cards (Forms, Icons, Typography, Layout, Motion)
  - FormComponentsPage, IconComponentsPage, TypographyComponentsPage, LayoutComponentsPage, MotionComponentsPage
  - All with live demos, code examples, and variant demonstrations
- Code style standardisation: Converted all 40+ components to `const Component: React.FC = () => {}` pattern
- Updated CLAUDE.md to enforce React component arrow function pattern
- Added dependencies: framer-motion, react-router-dom@^7.9.6, strip-json-comments@^5.0.3
- Backend refactoring: Converted services/repositories to arrow functions (noted in code review)
- Added comprehensive Zod schemas: customer.schema.ts, tenant.schema.ts, enhanced user.schema.ts
- Schema exports now single source of truth for types
- Enhanced test coverage for z.coerce.date() handling (60+ new tests)
- TypeScript configuration optimised: VS Code settings to prevent TS Server crashes
- Bundle size: 650KB uncompressed (190KB gzipped) - acceptable for Phase 1

**Session 48 (Nov 15)**: ✅ FFP-119 - Basic Routing Infrastructure (Initial Implementation - 2h)

- Installed react-router-dom@^7.9.6 and @types/react-router-dom@^5.3.3 packages
- Created type-safe routing infrastructure:
  - RouteKey enum for compile-time safety
  - Routes configuration with AppRoute interface (includes devOnly flag)
  - Router component with environment-based filtering (excludes dev routes in production)
  - ProtectedRoute wrapper using existing AuthContext from FFP-90
- Created placeholder pages:
  - LoginPage (public, placeholder for FFP-92 implementation)
  - HomePage (protected, displays user JWT claims)
  - NotAuthorisedPage (403 error page)
- Created AppLayout component with sidebar navigation wrapper for protected routes
- Created component showcase routes (dev-only, excluded in production):
  - ComponentsPage - Landing page with category cards
  - FormComponentsPage - Form components demo (moved from FormTest)
  - IconComponentsPage - Icon components demo (moved from IconTest)
- Updated App.tsx to render Router instead of test components
- Implemented environment-based route filtering (import.meta.env.PROD)
- Public routes: /login
- Protected routes: / (home/dashboard)
- Dev-only routes: /components, /components/form, /components/icon
- Catch-all route redirects to home (which redirects to login if not authed)
- ProtectedRoute features:
  - Uses real useAuth() hook (no placeholder)
  - Shows loading spinner during auth check
  - Redirects to /login if not authenticated
  - Wraps content in AppLayout by default
  - Supports excludeLayout prop for fullscreen pages
- Zero TypeScript errors, zero ESLint warnings, zero `any` types
- Production build successful (541KB main chunk, acceptable for Phase 1)
- British English spelling throughout
- All acceptance criteria met
- Created comprehensive review context document
- Manual testing completed successfully
- FFP-95 (logout functionality) integrated - sign out button works in HomePage
- Ready for FFP-92 (Implement Login Form)

**Session 47 (Nov 14)**: ✅ FFP-90 - Create AuthContext and AuthProvider COMPLETE (4h)

- Created AuthContext.tsx with User interface, UserRole type, and type guard validation
- Implemented AuthProvider component managing auth state (user, loading, error)
- Implemented checkAuth() function with JWT claim extraction and comprehensive validation
  - Extracts userId, email from standard JWT claims
  - Extracts tenantId from custom:tenantId claim
  - Extracts role from custom:role claim with runtime validation against database schema
- Implemented login() and logout() functions wrapping Amplify auth methods
- Created useAuth() custom hook with proper error boundary
- Created FormTest.tsx manual testing page with login form and user display
- Added @web/contexts path alias to TypeScript and Vite configs
- Wrapped App with AuthProvider and StrictMode in main.tsx
- Created MANUAL-TEST-FFP-90.md with 10 comprehensive test scenarios
- Completed manual testing successfully:
  - Login flow with valid credentials verified
  - JWT claim extraction validated (all fields populated correctly)
  - Loading states during auth operations confirmed
  - Error handling tested with invalid credentials
  - Logout flow verified
  - Session persistence confirmed (browser refresh)
- Zero TypeScript errors, zero ESLint warnings, zero `any` types
- British English spelling throughout
- All acceptance criteria met
- Created comprehensive review context document
- **IDE Performance Issue Resolved**: Encountered TypeScript server crash loop caused by pnpm's `.pnpm/` directory overwhelming file watchers. Applied comprehensive fix (watchOptions in tsconfig, VS Code settings, disabled TypeScript Importer extension). TS Server now stable with zero crashes. Created `ts-server-debug-guide.md` for future reference.
- Ready for FFP-92 (Implement Login Form)

**Session 46 (Nov 13)**: ✅ FFP-93 - AWS Amplify Setup COMPLETE (1h)

- Installed aws-amplify and @aws-amplify/ui-react packages in @ffp/web
- Created lib/auth.ts configuration file with Cognito User Pool credentials
- Added environment variables to .env.local with VITE\_ prefix for client exposure
- Extended vite-env.d.ts with type-safe ImportMetaEnv interface
- Initialised Amplify in main.tsx entry point (side-effect import pattern)
- Exported MVP auth methods: signIn, signOut, getCurrentUser, fetchAuthSession
- Intentionally excluded signUp (invite-only user creation for MVP)
- Zero TypeScript errors, zero ESLint warnings, zero `any` types
- British English spelling throughout (initialise, optimise)
- All acceptance criteria met
- Ready for FFP-90 (AuthContext and AuthProvider)

**Session 45 (Nov 13)**: ✅ FFP-115 - Component Library COMPLETE + Code Review (4h)

- Implemented Tailwind CSS v4 with CSS-first `@theme` configuration
- Created complete FFP colour system (primary, secondary, success, warning, error with 50-950 shades)
- Integrated Inter font family with optimised weights (400, 500, 600, 700)
- Built type-safe form pattern with React Hook Form + Zod automatic schema generation
- Created form components: FormTextInput, FormPasswordInput, FormEmailInput with full accessibility
- Implemented Icon system with auto-generated TypeScript types from Icomoon (134 icons)
- Created Icon component with size variants (xs-xl) and type-safe colour props
- Enhanced components with ARIA attributes (aria-required, aria-invalid, aria-describedby)
- Added form-level error display with Icon and dismiss functionality
- Achieved zero TypeScript errors, zero ESLint warnings, zero `any` types
- British English compliance throughout (colour, optimise, behaviour)
- All acceptance criteria met for FFP-115a, FFP-115b, FFP-115c
- Ready for FFP-93 (AWS Amplify setup)

**Session 44 (Nov 10)**: 🚀 FFP-16 - Planning & Ticket Updates (1h)

- Reviewed FFP-16 user story and all subtasks (FFP-90 to FFP-100)
- Identified need for component library setup before form implementation
- Created FFP-115 (Component Library & Design System Setup) - 3-4h estimate
- Deferred FFP-91 (registration form) to Phase 2 - admin-only onboarding
- Deferred FFP-98 (integration tests) to post-MVP - consistent with FFP-12
- Updated FFP-93 with detailed acceptance criteria for Amplify setup
- Created comprehensive executable prompt for FFP-115
- Established execution order (component library → Amplify → forms → routing → tests)
- User decisions: Tailwind theme (will provide colours), Icomoon icons, form pattern
- Ready to tackle FFP-115 (Component Library) in next session

**Session 43 (Nov 10)**: ✅ FFP-12 - Testing Infrastructure COMPLETE (0.5h)

- Reviewed FFP-12 against current state (4 subtasks already complete)
- Made strategic decision to defer Playwright/MSW to post-MVP
- Updated testing-strategy.md to reflect Phase 1 pragmatic approach
- Clarified Phase 1 focus: Unit tests (90%) + RLS integration tests (10%)
- No new infrastructure needed - Vitest fully operational with 185 tests
- Updated Jira tickets (4 complete, 7 deferred, 1 doc update done)
- FFP-12 story complete - ready for FFP-16 (Web Login Interface)

**Session 42 (Nov 10)**: ✅ FFP-41 - Unit Tests COMPLETE + RLS Fix (4h)

- Created comprehensive context.ts unit tests (60 tests, 926 lines)
- Achieved zero ESLint violations using proper TypeScript types (no `any` or disable directives)
- Created type-safe helper functions for error testing (Partial types, union types, `as never`)
- Investigated and fixed RLS test failures (13 tests in @ffp/database package)
- Root cause: `root_user` had BYPASSRLS privilege, completely bypassing RLS policies
- Solution: Removed BYPASSRLS with `ALTER ROLE root_user NOBYPASSRLS;`
- All 68 database tests now passing (including all 16 RLS tests)
- Total: 185/185 tests passing across core and database packages
- FFP-9 story now complete (10/13 subtasks, deferred FFP-42/45 for FFP-12)

**Session 41 (Nov 11)**: 🚀 FFP-41 - Unit Tests IN PROGRESS

- Analysed ticket: auth schema, error, and logger tests already exist (comprehensive)
- Missing: context.ts tests (extractUserContext, createSystemContext, extractJobContext)
- Created executable prompt for context.ts unit tests
- Scope: Write missing context tests only, verify 10% coverage target achieved
- Expected completion: ~2-3 hours (ticket estimated 4h, reduced scope)

**Session 40 (Nov 11)**: ✅ FFP-40 - API Gateway Routes Verification COMPLETE (1h)

- Verified SST configuration (routes, CORS, environment variables, JWT authoriser)
- Confirmed domain proxy routing pattern (ANY /auth/{proxy+}, ANY /admin/{proxy+})
- Verified all routes in domain routers (auth: 4 routes, admin: 1 route)
- Updated Jira FFP-40 description to match actual implementation
- Documented domain proxy routing approach and benefits
- All acceptance criteria verified and marked complete
- Routes: POST /admin/create-customer, POST /auth/invite-user, POST /auth/login, POST /auth/complete-new-password, POST /auth/refresh-token, GET /health
- CORS configured globally with stage-aware origins
- Health check kept simple (no three-tier context, appropriate for monitoring)
- All Phase 3 subtasks now complete and ready for review

**Session 39 (Nov 11)**: ✅ FFP-39 - Refresh Token Lambda COMPLETE (2h)

- Implemented refresh-token endpoint (POST /auth/refresh-token) for automatic token renewal
- Created `packages/core/src/auth/refresh-token.service.ts` - Calls CognitoService.refreshToken()
- Created `packages/functions/src/auth/refresh-token.ts` - Public Lambda handler
- Added refreshTokenSchema validation to auth schemas
- Returns new access/ID tokens (1-hour validity) with original refresh token (30-day validity)
- No refresh token rotation (Cognito default behaviour - simplifies client implementation)
- Comprehensive error handling (invalid/expired tokens return 401 Unauthorised)
- No non-null assertions used (proper validation throughout)
- Updated route registry to include POST /auth/refresh-token
- Created comprehensive manual testing guide in FFP-39-manual-testing.md
- All TypeScript checks pass, ESLint clean, ready for code review

**Session 38 (Nov 11)**: ✅ FFP-38 - Login Lambda COMPLETE (3h)

- Implemented login endpoint (POST /auth/login) with NEW_PASSWORD_REQUIRED challenge flow
- Implemented complete-new-password endpoint (POST /auth/complete-new-password)
- Added completeNewPassword() method to CognitoService (RespondToAuthChallengeCommand)
- Created login and complete-new-password services with proper validation
- Fixed 401 Unauthorised error by making /auth/\* routes public at API Gateway level
- Updated Postman collection with Login and Complete New Password requests
- Updated authentication.md with concise testing guide and implementation descriptions
- All TypeScript checks pass, ESLint clean, ready for code review

**Session 37 (Nov 9)**: ✅ FFP-37 - Invite User Lambda COMPLETE (4h)

- Fixed invite-user endpoint IAM permissions (Cognito AdminCreateUser access)
- Added Cognito IAM permissions to SST auth route Lambda
- Fixed test suite to use API Gateway V2 event structures
- Updated Postman collection with tenantId/customerId placeholders for system admin mode
- All 125 tests passing in @ffp/core
- Zero TypeScript errors and ESLint warnings
- Ready for deployment and end-to-end testing

**Session 36 (Nov 8)**: ✅ FFP-112 - Admin API Endpoint COMPLETE (4.5h)

- Admin domain created (repository, service, schemas)
- POST /admin/create-customer Lambda handler with JWT + role validation
- Request context utilities (unified db + tenant context)
- Cryptographically secure random generation (crypto.randomInt)
- Stage-aware SSL detection for database connections
- Domain-organised architecture pattern established
- Security review fixes applied (error handling, British spelling)

**Session 35 (Nov 6)**: ⏸️ FFP-32 - Secrets Manager DEFERRED (0.5h)

- Decision to defer until actual secret requirements arise
- Cognito JWTs use public key verification (no signing secret needed)
- Will revisit during staging readiness / RDS setup

**Session 34 (Nov 6)**: ✅ FFP-44 - Structured Logging (2h)

- Logger class with CloudWatch JSON output and actor awareness
- Log level filtering (DEBUG/INFO/WARN/ERROR)
- Lambda wrapper integration with automatic request logging
- 27 new tests (125 total)

**Session 33 (Nov 5)**: ✅ FFP-36 - Tenant Context Extraction (2h)

- Actor-based architecture (UserActor, SystemActor)
- Enhanced TenantContext with actor, requestId, timestamp
- Runtime validation for JWT claims
- Helper functions for actor display names

**Session 31 (Nov 3)**: ✅ FFP-43 - Error Handling Classes (3.5h)

- Custom error hierarchy (7 error types)
- Lambda middleware wrapper with error-to-HTTP conversion
- CognitoService wrapper
- 55 comprehensive tests

---

## Sprint 1 Summary (COMPLETE)

**Duration**: 20th October - 9th November 2025
**Total Stories**: 10 stories, 197 hours planned
**Completed**: 6 stories (135.5/197 hours, 69%)
**Carried Over to Sprint 2**: FFP-9 (6 remaining subtasks, ~9-10 hours)
**Deferred**: FFP-14 (CloudWatch Monitoring)

**Completed Stories**:

- FFP-7: Turborepo Monorepo Setup (13h)
- FFP-8: SST Infrastructure Foundation (17h)
- FFP-106/107/108: Database Package Refactoring (3h)
- FFP-10: PostgreSQL Schema with RLS (24h)
- FFP-11: Drizzle ORM Setup (22h)
- FFP-15: Error Handling Patterns (15h - via FFP-43)

**Key Achievements**:

- Infrastructure deployed to dev environment
- Domain-organised architecture established
- Actor-based context system implemented
- 125+ tests passing with zero TypeScript errors

---

## What's Working

**Infrastructure (Deployed)**:

- ✅ SST v3 Ion, Cognito User Pool, S3 + CloudFront, API Gateway with JWT authorizer
- ✅ Local PostgreSQL with Drizzle ORM, RLS policies, connection pooling
- ✅ Error handling, tenant context, structured logging

**Monorepo**:

- ✅ Turborepo with 4 packages (web, functions, core, database)
- ✅ TypeScript strict mode, ESLint + Prettier, 125+ tests passing
- ✅ Build caching (30-100x faster), workspace dependencies
- ✅ Domain-organised backend with admin operations

---

## Key Decisions

**FFP-119 (Web Routing & Component Library)** - Sessions 49-50:

- **React component pattern standardised**: All React components use `const Component: React.FC = () => {}`
  - Provides explicit typing and consistent export pattern
  - Applied across ~40+ components (routing, forms, icons, ui, layout, motion, dev)
  - **Important**: Backend functions should use traditional `function` declarations (better stack traces, hoisting)
  - Distinction documented in CLAUDE.md
- **Schema-first type generation**: Zod schemas are single source of truth for all types
  - Types exported from `packages/core/src/schemas/` via `z.infer<typeof schema>`
  - `./types` directory deprecated in favour of schema-derived types
  - Prevents type/validation drift (runtime and compile-time safety)
  - Applied to User, UserRole, Tenant, TenantType, Customer, CustomerStatus
- **Component library architecture**: Atomic design with domain-specific directories
  - `form/`, `icons/`, `ui/`, `layout/`, `motion/`, `dev/` for clear organisation
  - Barrel exports (`index.ts`) for clean imports
  - British English prop names throughout (`colour`, `initialise`, `optimise`)
- **Dev-only component showcases**: Development routes excluded from production builds
  - Environment-based filtering via `import.meta.env.PROD`
  - Routes marked with `devOnly: true` flag
  - Accessible at `/components/*` in development only
  - High-ROI developer experience feature for rapid component testing
- **Framer Motion accepted**: ~50KB bundle cost justified for Phase 1 animation quality
  - GPU-accelerated animations provide smooth user experience
  - Critical for healthcare app perceived quality and trust
  - Defer optimisation (CSS-only alternatives) to Phase 2 if needed
- **Bundle size monitoring**: 650KB uncompressed (190KB gzipped) acceptable for Phase 1
  - Not mobile-first (physiotherapist dashboard = desktop/tablet)
  - Track in CI but don't optimise until >1MB or user feedback indicates slowness
  - Route-level code splitting deferred to post-MVP

**FFP-112 (Admin API)** - Session 36:

- **Domain-organised architecture pattern established**: Handler → Service → Repository
- Admin operations use privileged database connection (BYPASSRLS permission required)
- Request context pattern: Unified `RequestContext` interface combining db + tenant context
- Cryptographically secure random generation (Node.js crypto, server-only exports)
- Stage-aware SSL detection for database connections (local/dev vs staging/production)
- Clean error propagation: Let `withErrorHandling` wrapper handle all errors naturally
- No try-catch blocks in handlers/services unless specific error transformation needed

**FFP-32 (Secrets Manager)** - Session 35:

- **DEFERRED** until staging readiness / RDS setup
- Cognito JWTs use custom attributes (`custom:tenantId`, `custom:role`)
- JWT verification uses Cognito public keys (JWKS) - no signing secret needed
- No custom JWT generation in Phase 1
- Will implement when actual secrets required (DB encryption keys, API keys)

**FFP-9 (Cognito Auth)**:

- Admin-only business onboarding for MVP (no self-registration)
- Three-tier architecture: tenant → customer → users
- JWT claims: tenantId, customerId, role
- Super admin bootstrap + manual business creation via API
- Invite-only user creation

**Architecture**:

- Domain-organised backend (Handler → Service → Entity → Repository → Schema)
- Actor-based context (User vs System actors)
- Multi-tenant isolation via RLS (all tables have tenant_id)
- Lambda-optimised connection pooling (max 10 connections)

---

## Quick Reference

**Jira Project**: FFP (Fit For Purpose)
**Site**: https://ctregaskis.atlassian.net
**Project Key**: FFP

**Current Sprint**: Sprint 2 (10th Nov - 30th Nov 2025)

**EPIC FFP-1: Application Setup** (Sprint 1-2):

- Completed: FFP-7, FFP-8, FFP-10, FFP-11, FFP-15, FFP-9, FFP-12
- Next: FFP-16 (Web Login Interface)
- Deferred: FFP-14 (CloudWatch Monitoring)

**Sprint 2 Planning**:

- FFP-110: Assessment Engine Epic Planning (prepare for next epic)

**Critical Success Criteria**:

- ✅ All TypeScript strict mode, no errors
- ✅ RLS integration tests pass (cross-tenant isolation verified)
- ✅ JWT contains tenantId, role, customerId
- ✅ Infrastructure deployed to dev environment
- ✅ Database schemas defined and merged
- ✅ Unit test coverage for critical paths (185 tests passing, 10% target achieved)
- ✅ Test infrastructure configured (Vitest operational)
- ⏸️ E2E authentication tests (deferred to post-MVP)
- ⏸️ Advanced test coverage reporting (deferred to post-MVP)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
