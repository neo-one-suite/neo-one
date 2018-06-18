import { name } from '@neo-one/server-plugin';
import { CustomError } from '@neo-one/utils';

export class PluginDependencyNotMetError extends CustomError {
  public readonly code: string;

  public constructor({ plugin, dependency }: { readonly plugin: string; readonly dependency: string }) {
    super(`Plugin ${plugin} depends on plugin ${dependency}`);
    this.code = 'PLUGIN_DEPENDENCY_NOT_MET';
  }
}

export class ServerRunningError extends CustomError {
  public readonly code: string;
  public readonly exitCode: number;

  public constructor(pid: number) {
    super(`${name.title} running at pid ${pid}`);
    this.code = 'SERVER_RUNNING_ERROR';
    this.exitCode = 11;
  }
}

export class ResourceNoStartError extends CustomError {
  public readonly code: string;

  public constructor({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }) {
    super(`Plugin ${plugin} resource type ${resourceType} does not support starting`);

    this.code = 'RESOURCE_NO_STOP';
  }
}

export class ResourceNoStopError extends CustomError {
  public readonly code: string;

  public constructor({ plugin, resourceType }: { readonly plugin: string; readonly resourceType: string }) {
    super(`Plugin ${plugin} resource type ${resourceType} does not support stopping`);

    this.code = 'RESOURCE_NO_STOP';
  }
}
