/* @flow */
export class ReadError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class UnknownPluginResourceType extends Error {
  code: string;

  constructor({
    plugin,
    resourceType,
  }: {|
    plugin: string,
    resourceType: string,
  |}) {
    super(`Plugin ${plugin} does not have resource ${resourceType}`);
    this.code = 'UNKNOWN_PLUGIN_RESOURCE_TYPE';
  }
}

export class PluginNotInstalledError extends Error {
  code: string;

  constructor(nameIn: string) {
    super(`Plugin ${nameIn} is not installed`);
    this.code = 'PLUGIN_NOT_INSTALLED';
  }
}
