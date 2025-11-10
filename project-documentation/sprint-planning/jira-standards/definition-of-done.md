# Definition of Done

## User Story DoD

- [ ] **Code Quality**
  - TypeScript strict mode, no `any` types
  - No linting errors (ESLint + Prettier)
  - SOLID principles followed
  - Service layer + Repository pattern

- [ ] **Validation & Security**
  - Zod schemas for all API inputs
  - RLS context set for all DB queries
  - Tenant context validated
  - No PHI/sensitive data in logs

- [ ] **Testing**
  - Unit tests written and passing (min 2)
  - Integration test for multi-tenant isolation
  - E2E test for critical flow (if applicable)
  - All tests pass in CI
  - 10% coverage threshold met

- [ ] **Deployment**
  - Code merged to `develop`
  - Deployed to dev via SST
  - Manually tested in dev
  - Smoke tests passing
  - API response <500ms (p95)

- [ ] **Documentation**
  - Code comments for complex logic
  - API docs updated (if new endpoints)
  - Architecture docs updated (if new patterns)
  - Relevant `project-documentation/` updated

- [ ] **Review & Cleanup**
  - Self-review completed
  - No console.log (use structured logging)
  - No commented-out code
  - No TODO comments (create Jira tickets)

---

## Task DoD

- [ ] **Implementation**
  - Task objective completed
  - Configuration changes applied
  - All files created/modified

- [ ] **Verification**
  - Verification steps executed
  - Deployed to dev (if applicable)
  - Manually validated

- [ ] **Testing**
  - Unit tests passing (if applicable)
  - Integration tests passing (if applicable)

- [ ] **Documentation**
  - Docs updated (if specified)
  - Config documented in comments

---

## Bug DoD

- [ ] **Fix**
  - Root cause identified and documented
  - Fix implemented and tested
  - No regression introduced

- [ ] **Testing**
  - Unit test added to prevent regression
  - Integration test (if multi-tenant issue)
  - Manual testing completed

- [ ] **Verification**
  - Bug no longer reproducible
  - Original steps now pass
  - Related functionality works

- [ ] **Deployment**
  - Deployed to dev
  - Deployed to staging (if critical)
  - Deployed to production (if blocker)

- [ ] **Documentation**
  - Root cause documented
  - Post-mortem (if blocker/critical)
  - Prevention measures documented

---

## Epic DoD

- [ ] All child User Stories marked Done
- [ ] Integration tests passing for feature set
- [ ] Documentation updated in `project-documentation/`
- [ ] Security review completed (if applicable)
- [ ] Performance benchmarks met (if applicable)
- [ ] Deployed to staging and validated
