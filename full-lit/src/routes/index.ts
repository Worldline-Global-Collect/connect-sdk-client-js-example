import { Router, type Route } from '@vaadin/router';

export const RouteViewComponentName = {
  Details: 'wl-view-details',
  PaymentMethodSelection: 'wl-view-products',
  PaymentProductDetail: 'wl-view-product',
  PaymentProductGroupDetail: 'wl-view-group',
  EncryptedPayload: 'wl-view-encrypted-payload',
} as const;

export type RouteViewComponentName =
  (typeof RouteViewComponentName)[keyof typeof RouteViewComponentName];

const routePaths = new Map<RouteViewComponentName, string>([
  [RouteViewComponentName.Details, '/details'],
  [RouteViewComponentName.PaymentMethodSelection, '/products'],
  [RouteViewComponentName.PaymentProductDetail, '/products/product/:id'],
  [RouteViewComponentName.PaymentProductGroupDetail, '/products/group/:id'],
  [RouteViewComponentName.EncryptedPayload, '/encrypted-payload/:payload'],
]);

/**
 * Get the path by view component name
 * @param componentName - View Component name
 * @param params - Route parameters
 */
export function getViewComponentPath(
  componentName: RouteViewComponentName,
  params?: Record<string, string>,
) {
  return routePaths
    .get(componentName)
    ?.replace(/:([^/]+)/g, (_, key) => params?.[key] || '');
}

export function navigateToView(componentName: RouteViewComponentName): boolean;
export function navigateToView(
  componentName: RouteViewComponentName,
  params?: Record<string, string>,
): boolean;

/**
 * Navigate to component view
 * @param componentName - View Component name
 * @param params - Route parameters
 */
export function navigateToView(
  componentName: RouteViewComponentName,
  params?: Record<string, string>,
) {
  const path = getViewComponentPath(componentName, params);
  if (!path) {
    throw new Error(`No path found for view component: ${componentName}`);
  }
  return Router.go(path);
}

/**
 * Return "@vaadin routes" for all view components
 */
export const routes: Route[] = [...routePaths.entries()].map(
  ([component, path]) => ({
    path,
    component,
  }),
);
