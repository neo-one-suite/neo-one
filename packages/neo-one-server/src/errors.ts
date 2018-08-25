import { name } from '@neo-one/server-plugin';
import { makeErrorWithCode } from '@neo-one/utils';

export const PluginDependencyNotMetError = makeErrorWithCode(
  'PLUGIN_DEPENDENCY_NOT_MET',
  ({ plugin, dependency }: { readonly plugin: string; readonly dependency: string }) =>
    `Plugin ${plugin} depends on plugin ${dependency}`,
);
export const ServerRunningError = makeErrorWithCode(
  'SERVER_RUNNING_ERROR',
  (pid: number) => `${name.title} running at pid ${pid}`,
);
export const ResourceNoStartError = makeErrorWithCode(
  'RESOURCE_NO_STOP',
  ({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }) =>
    `Plugin ${plugin} resource type ${resourceType} does not support starting`,
);
export const ResourceNoStopError = makeErrorWithCode(
  'RESOURCE_NO_STOP',
  ({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }) =>
    `Plugin ${plugin} resource type ${resourceType} does not support stopping`,
);
