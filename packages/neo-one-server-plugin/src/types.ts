import { Monitor } from '@neo-one/monitor';
import { Paths } from 'env-paths';
import { Observable, Subject } from 'rxjs';
import Vorpal, { Args, Command } from 'vorpal';
import { ResourceDependency } from './MasterResourceAdapter';
import { ResourceAdapter } from './ResourceAdapter';
import { ResourceType } from './ResourceType';
import { Task, TaskList } from './TaskList';

export type ListTable = ReadonlyArray<readonly string[]>;
export interface SubDescribeTable {
  readonly type: 'describe';
  readonly table: DescribeTable;
}
export type DescribeTable = ReadonlyArray<
  [string, string | { readonly type: 'list'; readonly table: ListTable } | SubDescribeTable]
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
  readonly resources: readonly BaseResource[];
}
export interface DescribeResourceResponse {
  readonly resource: BaseResource;
}
export interface TaskStatus {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly subtasks?: readonly TaskStatus[];
  readonly pending?: boolean;
  readonly skipped?: string | boolean;
  readonly complete?: boolean;
  readonly error?: string;
  readonly collapse: boolean;
}

export interface ExecuteTaskListResponse {
  readonly tasks: readonly TaskStatus[];
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

export interface ExecuteTaskListRequestStart {
  readonly type: 'start';
  readonly plugin: string;
  readonly options: string;
}

export interface ExecuteTaskListRequestAbort {
  readonly type: 'abort';
}

export type ExecuteTaskListRequest = ExecuteTaskListRequestStart | ExecuteTaskListRequestAbort;

export interface CRUDRequestStart extends ExecuteTaskListRequestStart {
  readonly resourceType: string;
  readonly name: string;
}

export interface CRUDRequestAbort extends ExecuteTaskListRequestAbort {}
export type CRUDRequest = CRUDRequestStart | CRUDRequestAbort;
export interface AllResources {
  readonly [pluginResourceType: string]: readonly BaseResource[];
}

export interface Client {
  readonly getVersion: () => Promise<string>;
  readonly getDebug: () => Promise<DescribeTable>;
  readonly getAllPlugins: () => Promise<readonly string[]>;
  readonly getPlugins$: () => Observable<string>;
  readonly getAllResources$: () => Observable<AllResources>;
  readonly getResources$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly options: BaseResourceOptions;
  }) => Observable<readonly BaseResource[]>;
  readonly getResource$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
  }) => Observable<BaseResource | undefined>;
  readonly getResource: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
  }) => Promise<BaseResource | undefined>;
  readonly createResource$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly cancel$: Observable<void>;
  }) => Observable<ExecuteTaskListResponse>;
  readonly createResource: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly cancel$: Observable<void>;
  }) => Promise<BaseResource>;
  readonly deleteResource$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly cancel$: Observable<void>;
  }) => Observable<ExecuteTaskListResponse>;
  readonly startResource$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly cancel$: Observable<void>;
  }) => Observable<ExecuteTaskListResponse>;
  readonly stopResource$: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: BaseResourceOptions;
    readonly cancel$: Observable<void>;
  }) => Observable<ExecuteTaskListResponse>;
  readonly executeTaskList$: (options: {
    readonly plugin: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }) => Observable<ExecuteTaskListResponse>;
}

export interface Binary {
  readonly cmd: string;
  readonly firstArgs: readonly string[];
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
  readonly shutdown: (options: { readonly exitCode: number; readonly error?: Error }) => void;
  mutableShutdownFuncs: Array<() => void>;
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
// tslint:disable-next-line no-any
export type Session = any;

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
  // tslint:disable-next-line no-any
  readonly prompt: (questions: readonly object[]) => Promise<any>;
  readonly monitor: Monitor | undefined;
  readonly exec: (command: string) => Promise<void>;
  readonly printDescribe: (describeTable: DescribeTable, log?: (value: string) => void) => void;
  readonly printList: (listTable: ListTable, log?: (value: string) => void) => void;
  readonly print: (value: string) => void;
  readonly getResourceType: (options: { readonly plugin: string; readonly resourceType: string }) => ResourceType;
}

export interface InteractiveCLIArgs {
  readonly cli: InteractiveCLI;
}

export type InteractiveCommand = (cliArgs: InteractiveCLIArgs) => Command;

export type CLIHook = (options: { readonly cli: InteractiveCLI; readonly args: Args }) => Promise<void>;

export interface PortAllocator {
  readonly allocatePort: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly resource: string;
    readonly name: string;
  }) => number;
  readonly releasePort: (options: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly resource: string;
    readonly name?: string;
  }) => void;
}

export interface ResourcesManager<
  Resource extends BaseResource = BaseResource,
  ResourceOptions extends BaseResourceOptions = BaseResourceOptions
> {
  readonly getResource: (options: { readonly name: string; readonly options: ResourceOptions }) => Promise<Resource>;
  readonly getResources$: (options: ResourceOptions) => Observable<readonly Resource[]>;
  readonly getResource$: (options: {
    readonly name: string;
    readonly options: ResourceOptions;
  }) => Observable<Resource | undefined>;
  readonly getResourceAdapter: (name: string) => ResourceAdapter<Resource, ResourceOptions>;
  // tslint:disable-next-line no-any
  readonly masterResourceAdapter: any;
  readonly addDependent: (name: string, dependent: ResourceDependency) => void;
  readonly create: (name: string, options: ResourceOptions) => TaskList;
  readonly delete: (name: string, options: ResourceOptions) => TaskList;
  readonly start: (name: string, options: ResourceOptions) => TaskList;
}

export interface PluginManager {
  readonly httpServerPort: number;
  readonly getResourcesManager: (options: {
    readonly plugin: string;
    readonly resourceType: string;
  }) => ResourcesManager;
}

export type CreateHook = (options: {
  readonly name: string;
  readonly options: BaseResourceOptions;
  readonly pluginManager: PluginManager;
}) => Task;
