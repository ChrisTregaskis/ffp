# Story Point Reference

## Fibonacci Scale

FFP uses Fibonacci (1, 2, 3, 5, 8, 13) for estimation because:

- Non-linear scale reflects increasing uncertainty
- Prevents false precision
- Encourages breaking down large stories

---

## Quick Reference

| Points | Time | Complexity   | Examples                                  |
| ------ | ---- | ------------ | ----------------------------------------- |
| **1**  | 1-2h | Trivial      | Update text, simple config                |
| **2**  | 3-4h | Simple       | Basic API endpoint, Zod schema            |
| **3**  | 5-8h | Moderate     | API with logic, component with state      |
| **5**  | 1-2d | Complex      | Multiple endpoints, service layer feature |
| **8**  | 2-3d | Very Complex | Full feature (FE + BE + DB)               |
| **13** | 3-5d | Too Large    | **Split into smaller stories**            |

---

## Estimation Factors

Consider:

1. **Technical Complexity**
   - Simple CRUD vs complex business logic
   - Existing patterns vs new patterns
   - Integration points

2. **Unknowns & Research**
   - Well-understood vs exploratory
   - Familiar tech vs new tech
   - Documentation quality

3. **Testing Requirements**
   - Unit tests only vs integration + E2E
   - Simple vs complex edge cases
   - Multi-tenant isolation tests

4. **Documentation**
   - Minor updates vs new docs
   - Architecture diagrams

---

## Examples by Point Value

### 1 Point Examples

- Update environment variable
- Fix typo in documentation
- Add validation error message
- Simple CSS styling fix

### 2 Point Examples

- Create new Zod schema
- Add new API route (no business logic)
- Simple React component (button, card)
- Add database index

### 3 Point Examples

- API endpoint with Zod + basic business logic
- React component with useState + form
- Database migration with RLS policy
- Integration test for multi-tenant isolation

### 5 Point Examples

- User registration API (Cognito + DB)
- Assessment wizard frontend component
- Program generation service layer
- Video streaming with signed URLs

### 8 Point Examples

- Complete assessment submission (FE + BE + scoring)
- Video progress tracking (UI + API + DB)
- Business user invitation system
- Auth flow with JWT validation

### 13 Point Examples (split these!)

- Complete video management (upload + transcode + stream + progress)
- Full business portal (multiple pages, roles, permissions)

---

## FFP-Specific Considerations

**Multi-Tenant Work** (+1-2 points)

- RLS policy implementation
- Integration test for data isolation
- Tenant context validation

**Security Work** (+1 point)

- Zod schema definition
- OWASP compliance review
- Audit logging implementation

**Healthcare/PHI** (+1 point)

- PHI handling considerations
- Extra security review
- Compliance documentation

---

## When to Split Stories

**Split if:**

- Story is 13 points
- Story has >5 acceptance criteria
- Story spans multiple sprints
- Story has unclear requirements

**How to split:**

- By user type (individual vs business)
- By CRUD operation (create vs read/update)
- By platform (frontend vs backend)
- By happy path vs error handling

---

## Calibration Examples

Use these FFP stories to calibrate estimation:

**2 points**: Create Zod schema for registration  
**3 points**: Add RLS policy to users table  
**5 points**: User registration endpoint (Cognito + DB)  
**8 points**: Assessment submission flow (FE + BE + scoring)

---

## See Also

- **story-standards.md** - Story template and examples
- **task-standards.md** - Task estimation (similar scale)
