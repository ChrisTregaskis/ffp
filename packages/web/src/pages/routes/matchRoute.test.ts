import { describe, expect, it } from 'vitest';

import { matchRoute } from './matchRoute';

import { RouteKey, routes } from '.';

/** What an admin list route declares; its detail routes must say the same. */
const adminRoles = routes[RouteKey.ADMIN_TEMPLATES].allowedRoles;

describe('matchRoute', () => {
  it('resolves a static path to its own route', () => {
    expect(matchRoute('/admin/templates')?.route).toBe(routes[RouteKey.ADMIN_TEMPLATES]);
  });

  it('prefers a static route over a parameterised sibling that also matches', () => {
    expect(matchRoute('/admin/templates/create')?.route).toBe(
      routes[RouteKey.ADMIN_TEMPLATE_CREATE]
    );
  });

  it('resolves a parameterised path and returns its params', () => {
    const matched = matchRoute('/admin/templates/abc123');

    expect(matched?.route).toBe(routes[RouteKey.ADMIN_TEMPLATE_DETAIL]);
    expect(matched?.params).toEqual({ id: 'abc123' });
  });

  it('prefers the longer pattern over a shorter one that shares its prefix', () => {
    expect(matchRoute('/admin/templates/abc123/phases')?.route).toBe(
      routes[RouteKey.ADMIN_TEMPLATE_PHASES]
    );
  });

  it('resolves a multi-parameter path', () => {
    const matched = matchRoute('/admin/templates/abc123/phases/def456');

    expect(matched?.route).toBe(routes[RouteKey.ADMIN_TEMPLATE_PHASE_DETAIL]);
    expect(matched?.params).toEqual({ id: 'abc123', phaseId: 'def456' });
  });

  it('resolves the member-facing session route', () => {
    const matched = matchRoute('/programme/session/phase1/session1');

    expect(matched?.route).toBe(routes[RouteKey.SESSION_WORKOUT]);
    expect(matched?.params).toEqual({ phaseId: 'phase1', templateSessionId: 'session1' });
  });

  it('returns undefined for a path no route declares', () => {
    expect(matchRoute('/admin/nothing-here')).toBeUndefined();
  });

  // The guard is only as good as the route it resolves: string equality resolved
  // nothing for these, so allowedRoles never applied.
  it.each([
    ['/admin/organisations/abc123', RouteKey.ADMIN_ORGANISATION_EDIT],
    ['/admin/locations/abc123', RouteKey.ADMIN_LOCATION_EDIT],
    ['/admin/users/abc123', RouteKey.ADMIN_USER_EDIT],
    ['/admin/assessments/abc123', RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT],
    ['/admin/assessments/abc123/steps', RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS],
    ['/admin/assessments/abc123/preview', RouteKey.ADMIN_ASSESSMENT_FLOW_PREVIEW],
    ['/admin/videos/abc123', RouteKey.ADMIN_VIDEO_EDIT],
  ])('resolves %s so its system_admin restriction applies', (pathname, expectedKey) => {
    const matched = matchRoute(pathname);

    expect(matched?.route).toBe(routes[expectedKey]);
    expect(matched?.route.allowedRoles).toEqual(adminRoles);
  });
});
