/**
 * Dynamic route matching for the Fiyuu runtime server.
 * Builds a RouteIndex from FeatureRecords and matches incoming pathnames.
 */

import type { FeatureRecord } from "@fiyuu/core";
import type { DynamicRouteMatcher, RouteIndex, RouteMatch } from "./server-types.js";

export const QUERY_CACHE_SWEEP_INTERVAL_MS = 15_000;
export const QUERY_CACHE_MAX_ENTRIES = 2_000;

export function buildRouteRegex(route: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const parts = route.split("/").filter(Boolean);
  const regexParts = parts.map((segment) => {
    const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
    if (optionalCatchAll) {
      paramNames.push(optionalCatchAll[1]);
      return `(?:/(.*))?`;
    }
    const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
    if (catchAll) {
      paramNames.push(catchAll[1]);
      return `(.+)`;
    }
    const dynamic = segment.match(/^\[(\w+)\]$/);
    if (dynamic) {
      paramNames.push(dynamic[1]);
      return `([^/]+)`;
    }
    return segment.replace(/[$()*+.[\]?\\^{}|]/g, "\\$&");
  });
  return { regex: new RegExp(`^/${regexParts.join("/")}$`), paramNames };
}

export function buildRouteIndex(features: FeatureRecord[]): RouteIndex {
  const exact = new Map<string, FeatureRecord>();
  const dynamic = features
    .filter((feature) => feature.isDynamic)
    .sort((left, right) => {
      if (left.params.length !== right.params.length) {
        return left.params.length - right.params.length;
      }
      return right.route.length - left.route.length;
    })
    .map((feature) => {
      const { regex, paramNames } = buildRouteRegex(feature.route);
      return { feature, regex, paramNames } satisfies DynamicRouteMatcher;
    });

  for (const feature of features) {
    if (!feature.isDynamic) {
      exact.set(feature.route, feature);
    }
  }

  return { exact, dynamic };
}

export function matchRoute(routeIndex: RouteIndex, pathname: string): RouteMatch | null {
  const exact = routeIndex.exact.get(pathname);
  if (exact) {
    return { feature: exact, params: {} };
  }

  for (const matcher of routeIndex.dynamic) {
    const match = pathname.match(matcher.regex);
    if (!match) continue;
    const params: Record<string, string> = {};
    for (let i = 0; i < matcher.paramNames.length; i++) {
      params[matcher.paramNames[i]] = match[i + 1] ?? "";
    }
    return { feature: matcher.feature, params };
  }

  return null;
}
