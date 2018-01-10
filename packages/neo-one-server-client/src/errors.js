/* @flow */
import { CustomError } from '@neo-one/utils';

export class ReadError extends CustomError {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class UnknownPluginResourceType extends CustomError {
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

export class PluginNotInstalledError extends CustomError {
  code: string;

  constructor(nameIn: string) {
    super(`Plugin ${nameIn} is not installed`);
    this.code = 'PLUGIN_NOT_INSTALLED';
  }
}
