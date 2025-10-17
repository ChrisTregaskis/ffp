# Bug Standards

## Purpose

Bugs represent defects preventing system from working as intended. Clear, reproducible, prioritized by severity.

**When to use:**

- Feature works incorrectly
- Security vulnerability
- Performance degradation
- Data corruption

---

## Severity Guidelines

| Severity     | Description               | Examples                                    |
| ------------ | ------------------------- | ------------------------------------------- |
| **Blocker**  | System unusable           | DB corruption, auth broken, data loss       |
| **Critical** | Core functionality broken | Assessment fails, program generation broken |
| **Major**    | Important feature broken  | Video playback fails, progress incorrect    |
| **Minor**    | Minor feature broken      | UI glitch, typo                             |
| **Trivial**  | Cosmetic only             | Button alignment, color inconsistency       |

---

## Required Fields

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| **Issue Type** | Bug (10006)                                          |
| **Summary**    | [Bug]: [Brief description]                           |
| **Priority**   | Blocker, Critical, Major, Minor, Trivial             |
| **Severity**   | Same as Priority                                     |
| **Labels**     | `production`, `security`, `data-loss`, `performance` |

---

## Template

```markdown
## Summary

[One-line description]

## Environment

- **Version**: [e.g., v1.2.3]
- **Environment**: Production / Staging / Dev
- **Browser/Device**: [e.g., Chrome 118 on MacOS]
- **User Type**: Individual / Business Owner / Business User

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Impact

[Who affected? How many users? Business impact?]

## Logs / Error Messages
```

[Paste logs, errors, stack traces]

```

## Workaround (if any)

[Temporary workaround]

## Root Cause (if known)

[What caused this]

## Fix Proposal

[How to fix]
```

---

## Examples

### Example 1: Critical Bug

```markdown
**Summary**: [Bug] Assessment submission fails with "Tenant context not set"
**Priority**: Critical
**Severity**: Critical
**Labels**: production, multi-tenant, security

## Summary

Assessment submission failing with PostgreSQL error "Tenant context not set".

## Environment

- **Version**: v1.1.0
- **Environment**: Production
- **Browser/Device**: All browsers, all devices
- **User Type**: All users

## Steps to Reproduce

1. Login as any user
2. Start assessment
3. Answer all questions
4. Click "Submit Assessment"
5. Error: "Failed to submit assessment"

## Expected Behavior

Assessment submits, score calculated, redirect to program view.

## Actual Behavior

Error message: "Failed to submit assessment. Please try again."

CloudWatch logs:
```

{
"level": "ERROR",
"message": "Assessment submission failed",
"error": {
"message": "current_setting('app.tenant_id') is null",
"code": "42704"
}
}

````

## Impact

**Users Affected**: 50+ users since deployment

**Business Impact**:
- Users cannot complete assessments
- Core functionality broken
- Potential churn

## Logs / Error Messages

```json
{
  "level": "ERROR",
  "service": "AssessmentService",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "message": "current_setting('app.tenant_id') is null",
    "code": "42704"
  }
}
````

## Workaround (if any)

**No workaround.** Users blocked.

## Root Cause (if known)

Lambda `assessments/submit.ts` not calling `setRLSContext()` before DB queries. Introduced in refactor commit `abc123`.

## Fix Proposal

Add `await setRLSContext(context.tenantId, context.userId)` at handler start.

```typescript
export const handler = async (event) => {
  const context = extractTenantContext(event);
  await setRLSContext(context.tenantId, context.userId); // FIX
  // ...
};
```

````

### Example 2: Minor Bug

```markdown
**Summary**: [Bug] Video thumbnail not loading for new exercises
**Priority**: Minor
**Severity**: Minor
**Labels**: frontend, ui

## Summary

New exercise videos show broken image icon instead of thumbnail.

## Environment

- **Version**: v1.2.0
- **Environment**: Production
- **Browser/Device**: Chrome 118 on MacOS, Safari iOS
- **User Type**: All users

## Steps to Reproduce

1. Login
2. Navigate to Video Library
3. Scroll to recent exercises (last week)
4. Observe broken image icons

## Expected Behavior

Thumbnails display for all videos.

## Actual Behavior

Broken image icon. Console: 404 Not Found for thumbnail URLs.

## Impact

**Users Affected**: All users browsing library

**Business Impact**:
- Degraded UX
- Videos still playable (not broken)

## Workaround (if any)

Users can still play videos by clicking. Video titles visible.

## Root Cause (if known)

Recent uploads missing thumbnails in S3. `video_upload.sh` modified to skip thumbnail generation.

## Fix Proposal

1. Generate missing thumbnails with ffmpeg
2. Upload to S3
3. Fix `video_upload.sh` to always generate thumbnails

```bash
ffmpeg -i exercise-025.mp4 -ss 00:00:05 -vframes 1 exercise-025-thumb.jpg
aws s3 cp exercise-025-thumb.jpg s3://ffp-videos-prod/thumbnails/
````

```

---

## See Also

- **definition-of-done.md** - Bug DoD checklist
- **jira-fields.md** - Labels for bugs
```
