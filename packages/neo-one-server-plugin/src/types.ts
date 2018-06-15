import { Monitor } from '@neo-one/monitor';
import { Paths } from 'env-paths';
import { Observable, Subject } from 'rxjs';
import Vorpal, { Args, Command } from 'vorpal';
import { ResourceDependency } from './MasterResourceAdapter';
import { ResourceAdapter } from './ResourceAdapter';
import { ResourceType } from './ResourceType';
import { Task, TaskList } from './TaskList';

export type ListTable = ReadonlyArray<ReadonlyArray<string>>;
export type DescribeTable = ReadonlyArray<
  [
    string,


      | string
      | { readonly type: 'list'; readonly table: ListTable }
      | { readonly type: 'describe'; readonly table: DescribeTable }
  ]
>;

export type ResourceState = 'started' | 'stopped';
export interface BaseResource {
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly baseName: string;
  readonly state: ResourceState;
}

export type BaseResourceOptions = object;
export interface GetResourceResponse {
  readonly resources: ReadonlyArray<BaseResource>;
}
export interface DescribeResourceResponse {
  readonly resource: BaseResource;
}
export interface TaskStatus {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly subtasks?: ReadonlyArray<TaskStatus>;
  readonly pending?: boolean;
  readonly skipped?: string | boolean;
  readonly complete?: boolean;
  readonly error?: string;
  readonly collapse: boolean;
}

export interface ModifyResourceResponse {
  readonly tasks: ReadonlyArray<TaskStatus>;
}

export interface ReadRequest {
  readonly type: 'start' | 'abort';
}
export type ReadResponse =
  | {
      readonly type: 'response';
      // tslint:disable-next-line no-any
      readonly response: any;
    }
  | {
      readonly type: 'error';
      readonly code: string;
      readonly message: string;
    }
  | {
      readonly type: 'aborted';
    };

export interface CRUDRequestStart {
  readonly type: 'start';
  readonly plugin: string;
  readonly resourceType: string;
  readonly name: string;
  readonly options: string;
}

export interface CRUDRequestAbort {
  readonly type: 'abort';
}
export type CRUDRequest = CRUDRequestStart | CRUDRequestAbort;
export interface AllResources {
  readonly [pluginResourceType: string]: ReadonlyArray<BaseResource>;
}

export interface Client {
  readonly getVersion: () => Promise<string>;
  readonly getDebug: () => Promise<DescribeTable>;
  readonly getAllPlugins: () => Promise<ReadonlyArray<string>>;
  readonly getPlugins$: () => Observable<string>;
  readonly getAllResources$: () => Observable<AllResources>;
  readonly getResources$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly options: BaseResourceOptions;
    },
  ) => Observable<ReadonlyArray<BaseResource>>;
  readonly getResource$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
    },
  ) => Observable<BaseResource | null>;
  readonly getResource: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
    },
  ) => Promise<BaseResource | null>;
  readonly createResource$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
      readonly cancel$: Observable<void>;
    },
  ) => Observable<ModifyResourceResponse>;
  readonly createResource: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
      readonly cancel$: Observable<void>;
    },
  ) => Promise<BaseResource>;
  readonly deleteResource$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
      readonly cancel$: Observable<void>;
    },
  ) => Observable<ModifyResourceResponse>;
  readonly startResource$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
      readonly cancel$: Observable<void>;
    },
  ) => Observable<ModifyResourceResponse>;
  readonly stopResource$: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly name: string;
      readonly options: BaseResourceOptions;
      readonly cancel$: Observable<void>;
    },
  ) => Observable<ModifyResourceResponse>;
}

export interface Binary {
  readonly cmd: string;
  readonly firstArgs: ReadonlyArray<string>;
}

export interface LogConfig {
  readonly name: string;
  readonly path: string;
  readonly level: string;
  readonly maxSize: number;
  readonly maxFiles: number;
}

export interface CLIArgs {
  readonly monitor: Monitor;
  readonly shutdown: (
    options: {
      readonly exitCode: number;
      readonly error?: Error | null;
    },
  ) => void;
  // tslint:disable-next-line readonly-array
  readonly shutdownFuncs: Array<() => void>;
  readonly logConfig$: Subject<LogConfig>;
  readonly vorpal: Vorpal;
  readonly debug: boolean;
  readonly binary: Binary;
  readonly serverArgs: {
    readonly dir?: string;
    readonly serverPort?: number;
    readonly minPort?: number;
  };

  readonly paths: Paths;
}

export type Session = object;

export interface InteractiveCLI {
  readonly vorpal: Vorpal;
  readonly client: Client;
  readonly debug: boolean;
  readonly updateSession: (plugin: string, session: Session) => void;
  readonly mergeSession: (plugin: string, session: Session) => void;
  readonly getSession: (plugin: string) => Promise<Session>;
  readonly getSession$: (plugin: string) => Observable<Session>;
  readonly addDelimiter: (key: string, name: string) => void;
  readonly removeDelimiter: (key: string) => void;
  readonly resetDelimiter: () => void;
  readonly prompt: (questions: ReadonlyArray<object>) => Promise<object>;
  readonly monitor: Monitor;
  readonly exec: (command: string) => Promise<void>;
  readonly printDescribe: (describeTable: DescribeTable, log?: (value: string) => void) => void;

  readonly printList: (listTable: ListTable, log?: (value: string) => void) => void;
  readonly getResourceType: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
    },
  ) => // tslint:disable-next-line no-any
  ResourceType<any, any>;
}

export interface InteractiveCLIArgs {
  readonly cli: InteractiveCLI;
}

export type InteractiveCommand = (cliArgs: InteractiveCLIArgs) => Command;

export type CLIHook = (
  options: {
    readonly cli: InteractiveCLI;
    readonly args: Args;
  },
) => Promise<void>;

export interface PortAllocator {
  readonly allocatePort: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly resource: string;
      readonly name: string;
    },
  ) => number;

  readonly releasePort: (
    options: {
      readonly plugin: string;
      readonly resourceType: string;
      readonly resource: string;
      readonly name?: string;
    },
  ) => void;
}

export interface ResourcesManager<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> {
  readonly getResources$: (options: ResourceOptions) => Observable<ReadonlyArray<Resource>>;
  readonly getResource$: (
    options: { readonly name: string; readonly options: ResourceOptions },
  ) => Observable<Resource | null>;
  readonly getResourceAdapter: (name: string) => ResourceAdapter<Resource, ResourceOptions>;
  // tslint:disable-next-line no-any
  readonly masterResourceAdapter: any;
  readonly addDependent: (name: string, dependent: ResourceDependency) => void;
  readonly create: (name: string, options: ResourceOptions) => TaskList;
}

export interface PluginManager {
  readonly getResourcesManager: (
    options: { readonly plugin: string; readonly resourceType: string },
  ) => ResourcesManager;
}

export type CreateHook = (
  options: {
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly pluginManager: PluginManager;
  },
) => Task;
