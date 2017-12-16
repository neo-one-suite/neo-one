/* @flow */
// eslint-disable-next-line
export class FailedToKillServerError extends Error {
  code: string;

  constructor(pid: number) {
    super(`Failed to kill server at ${pid}`);
    this.code = 'FAILED_TO_KILL_SERVER';
  }
}

export class PluginNotInstalledError extends Error {
  code: string;

  constructor(name: string) {
    super(`Plugin ${name} is not installed`);
    this.code = 'PLUGIN_NOT_INSTALLED';
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

export class PluginDependencyNotMetError extends Error {
  code: string;

  constructor({
    plugin,
    dependency,
  }: {|
    plugin: string,
    dependency: string,
  |}) {
    super(`Plugin ${plugin} depends on plugin ${dependency}`);
    this.code = 'PLUGIN_DEPENDENCY_NOT_MET';
  }
}

export class ReadError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
