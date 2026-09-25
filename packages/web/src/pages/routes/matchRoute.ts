import { matchRoutes } from 'react-router-dom';

import { routes } from '.';

import type { AppRoute } from '.';

export interface MatchedRoute {
  route: AppRoute;
  params: Record<string, string | undefined>;
}

interface RouteBranch {
  path: string;
  route: AppRoute;
}

let branches: RouteBranch[] | undefined;

/**
 * Built on first call rather than at module scope, so this module never reads `routes`
 * while `./index` is still initialising.
 */
const routeBranches = (): RouteBranch[] =>
  (branches ??= Object.values(routes).map((route) => ({ path: route.path, route })));

/**
 * Resolve the route configuration for a pathname, with its matched params. Ranked by
 * `matchRoutes`, so `/admin/templates/create` beats `/admin/templates/:id` as it does
 * when the router picks the page.
 */
export const matchRoute = (pathname: string): MatchedRoute | undefined => {
  const matched = matchRoutes(routeBranches(), pathname)?.[0];

  return matched ? { route: matched.route.route, params: matched.params } : undefined;
};
