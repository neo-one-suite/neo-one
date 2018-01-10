/* @flow */
import { CustomError } from '@neo-one/utils';
import { name } from '@neo-one/server-plugin';

export class PluginDependencyNotMetError extends CustomError {
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

export class ServerRunningError extends CustomError {
  code: string;
  exitCode: number;

  constructor(pid: number) {
    super(`${name.title} running at pid ${pid}`);
    this.code = 'SERVER_RUNNING_ERROR';
    this.exitCode = 11;
  }
}

export class ResourceNoStartError extends CustomError {
  code: string;

  constructor({
    plugin,
    resourceType,
  }: {|
    plugin: string,
    resourceType: string,
  |}) {
    super(
      `Plugin ${plugin} resource type ${resourceType} does not support starting`,
    );
    this.code = 'RESOURCE_NO_STOP';
  }
}

export class ResourceNoStopError extends CustomError {
  code: string;

  constructor({
    plugin,
    resourceType,
  }: {|
    plugin: string,
    resourceType: string,
  |}) {
    super(
      `Plugin ${plugin} resource type ${resourceType} does not support stopping`,
    );
    this.code = 'RESOURCE_NO_STOP';
  }
}
