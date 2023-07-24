import { getRegistry } from '@redhat-cloud-services/frontend-components-utilities/Registry';
import promiseMiddleware from 'redux-promise-middleware';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { Middleware } from 'redux';

export let registry: ReturnType<typeof getRegistry>;

export function init(...middleware: Middleware[]) {
  registry = getRegistry({}, [promiseMiddleware, notificationsMiddleware({ errorDescriptionKey: ['detail', 'stack'] }), ...middleware]);
  return registry;
}
