import { matchRoutes } from 'react-router-dom';

import { routes } from './route-config';

import type { RouteConfig } from './route-config';

export interface MatchedRoute {
  route: RouteConfig;
  params: Record<string, string | undefined>;
}

const ROUTE_BRANCHES = Object.values(routes).map((route) => ({ path: route.path, route }));

/**
 * Resolve the route configuration for a pathname, with its matched params. Ranked by
 * `matchRoutes`, so `/admin/templates/create` beats `/admin/templates/:id` as it does
 * when the router picks the page.
 */
export const matchRoute = (pathname: string): MatchedRoute | undefined => {
  const matched = matchRoutes(ROUTE_BRANCHES, pathname)?.[0];

  return matched ? { route: matched.route.route, params: matched.params } : undefined;
};
