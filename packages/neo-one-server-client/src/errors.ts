import { makeErrorWithCode } from '@neo-one/utils';

export const ReadError = makeErrorWithCode(
  'READ_ERROR',
  (code: number, message: string) => `${message}, code: ${code}`,
);
export const UnknownPluginResourceType = makeErrorWithCode(
  'UNKNOWN_PLUGIN_RESOURCE_TYPE',
  ({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }) =>
    `Plugin ${plugin} does not have resource ${resourceType}`,
);
export const PluginNotInstalledError = makeErrorWithCode(
  'PLUGIN_NOT_INSTALLED',
  (nameIn: string) => `Plugin ${nameIn} is not installed`,
);
