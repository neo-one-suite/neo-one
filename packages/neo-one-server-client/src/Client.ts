// tslint:disable no-any
import * as protoLoader from '@grpc/proto-loader';
import { proto } from '@neo-one/server-grpc';
import {
  AllResources,
  BaseResource,
  DescribeTable,
  ExecuteTaskListRequestStart,
  ExecuteTaskListResponse,
  getTasksError,
} from '@neo-one/server-plugin';
import * as grpc from 'grpc';
import { Observable, Observer, Subject } from 'rxjs';
import { filter, map, publishReplay, refCount, take } from 'rxjs/operators';
import { ReadError } from './errors';

const packageDefinition = protoLoader.loadSync(proto, {});
// tslint:disable-next-line no-any
const { Server } = grpc.loadPackageDefinition(packageDefinition) as any;

type GRPCClient = grpc.Client & { readonly [key: string]: any };
// tslint:disable-next-line readonly-keyword
const mutableClients: { [key: number]: GRPCClient } = {};

export class Client {
  private readonly port: number;

  public constructor({ port, forceNew }: { readonly port: number; readonly forceNew?: boolean }) {
    this.port = port;

    if ((mutableClients[port] as GRPCClient | undefined) === undefined || forceNew) {
      mutableClients[port] = new Server(`localhost:${port}`, grpc.credentials.createInsecure());
    }
  }

  private get client(): GRPCClient {
    return mutableClients[this.port];
  }

  public async wait(): Promise<void> {
    await this.getVersion();
  }

  public async reset(): Promise<void> {
    return this.unary<void>(this.client.reset);
  }

  public async getVersion(): Promise<string> {
    return this.unary(this.client.getVersion, {}, (response) => response.version);
  }

  public async getDebug(): Promise<DescribeTable> {
    return this.unary(this.client.getDebug, {}, (response) => JSON.parse(response.debug));
  }

  public async getAllPlugins(): Promise<ReadonlyArray<string>> {
    return this.unary(this.client.getAllPlugins, {}, (response) => response.plugins);
  }

  public getPlugins$(): Observable<string> {
    return this.makeReadObservable$(this.client.getPlugins()).pipe(map((response) => response.plugin));
  }

  public getAllResources$(): Observable<AllResources> {
    return this.makeReadObservable$(this.client.getAllResources()).pipe(
      map((response) => JSON.parse(response.resources)),
    );
  }

  public getResources$({
    plugin,
    resourceType,
    options,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly options: object;
  }): Observable<ReadonlyArray<BaseResource>> {
    return this.makeReadObservable$(this.client.getResources(), {
      plugin,
      resourceType,
      options: JSON.stringify(options),
    }).pipe(map((response) => JSON.parse(response.resources)));
  }

  public getResource$({
    plugin,
    resourceType,
    name,
    options,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: object;
  }): Observable<BaseResource | undefined> {
    return this.makeReadObservable$(this.client.getResource(), {
      plugin,
      resourceType,
      name,
      options: JSON.stringify(options),
    }).pipe(
      map(
        (response) =>
          response.resource === '' || response.resource === undefined ? undefined : JSON.parse(response.resource),
      ),
    );
  }

  public async getResource({
    plugin,
    resourceType,
    name,
    options,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: any;
  }): Promise<BaseResource | undefined> {
    return this.getResource$({
      plugin,
      resourceType,
      name,
      options,
    })
      .pipe(take(1))
      .toPromise();
  }

  public createResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeCRUD$({
      call: this.client.createResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  public async createResource({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: any;
    readonly cancel$: Observable<void>;
  }): Promise<BaseResource> {
    const response = await this.createResource$({
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    }).toPromise();

    const error = getTasksError(response.tasks);
    if (error !== undefined) {
      throw new Error(error);
    }

    const resource = await this.getResource({
      plugin,
      resourceType,
      name,
      options,
    });

    if (resource === undefined) {
      throw new Error(`Failed to find ${resourceType}: ${name}`);
    }

    return resource;
  }

  public deleteResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: any;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeCRUD$({
      call: this.client.deleteResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  public startResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeCRUD$({
      call: this.client.startResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  public stopResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeCRUD$({
      call: this.client.stopResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  public executeTaskList$({
    plugin,
    options,
    cancel$,
  }: {
    readonly plugin: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeExecuteTaskList$({
      call: this.client.executeTaskList(),
      start: {
        type: 'start',
        plugin,
        options: JSON.stringify(options),
      },
      cancel$,
    });
  }

  private makeCRUD$({
    call,
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {
    readonly call: any;
    readonly plugin: string;
    readonly resourceType: string;
    readonly name: string;
    readonly options: object;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeExecuteTaskList$({
      call,
      start: {
        type: 'start',
        plugin,
        resourceType,
        name,
        options: JSON.stringify(options),
      },
      cancel$,
    });
  }

  private makeExecuteTaskList$<T extends ExecuteTaskListRequestStart = ExecuteTaskListRequestStart>({
    call,
    start,
    cancel$,
  }: {
    readonly call: any;
    readonly start: T;
    readonly cancel$: Observable<void>;
  }): Observable<ExecuteTaskListResponse> {
    return this.makeCancellable$(call, start, cancel$).pipe(map((response) => ({ tasks: JSON.parse(response.tasks) })));
  }

  private makeCancellable$(call: any, req: any, cancel$: Observable<void>): Observable<any> {
    return this.makeObservable$(call, () => {
      call.write(req);
      const subscription = cancel$.subscribe({
        next: () => {
          call.write({ type: 'abort' });
        },
        complete: () => {
          call.end();
        },
      });

      return () => subscription.unsubscribe();
    });
  }

  private makeReadObservable$(call: any, req?: any): Observable<any> {
    const cancel$ = new Subject<void>();

    return this.makeObservable$(call, () => {
      call.write({ ...(req === undefined ? {} : req), type: 'start' });
      const subscription = cancel$.subscribe({
        next: () => {
          call.write({ type: 'abort' });
        },
        complete: () => {
          call.end();
        },
      });

      return () => {
        cancel$.next();
        cancel$.complete();
        subscription.unsubscribe();
      };
    }).pipe(
      filter((response) => response.type !== 'aborted'),
      map((response) => {
        if (response.type === 'error') {
          throw new ReadError(response.code, response.message);
        }

        return response.response;
      }),
    );
  }

  private makeObservable$(call: any, start?: () => () => void): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      call.on('data', (value: any) => {
        observer.next(value);
      });
      call.on('error', (error: Error) => {
        observer.error(error);
      });
      call.on('end', () => {
        observer.complete();
      });
      let destroy: (() => void) | undefined;
      if (start !== undefined) {
        destroy = start();
      }

      return () => {
        if (destroy !== undefined) {
          destroy();
        }
      };
    }).pipe(
      publishReplay(),
      refCount(),
    );
  }

  private async unary<T>(
    func: (req: object, cb: (err: Error | undefined, response: any) => void) => void,
    req: object = {},
    callback?: (response: any) => T,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) =>
      (func.bind(this.client) as typeof func)(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(callback === undefined ? response : callback(response));
        }
      }),
    );
  }
}
