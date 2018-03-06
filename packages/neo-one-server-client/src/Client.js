/* @flow */
import {
  type AllResources,
  type BaseResource,
  type DescribeTable,
  type ModifyResourceResponse,
  getTasksError,
} from '@neo-one/server-plugin';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { filter, map, publishReplay, refCount, take } from 'rxjs/operators';
import grpc from 'grpc';
import proto from '@neo-one/server-grpc';

import { ReadError } from './errors';

const { Server } = grpc.load(proto);

export default class Client {
  static _CLIENTS = {};

  _port: number;

  constructor({ port, forceNew }: {| port: number, forceNew?: boolean |}) {
    this._port = port;

    if (this.constructor._CLIENTS[port] == null || forceNew) {
      this.constructor._CLIENTS[port] = new Server(
        `localhost:${port}`,
        grpc.credentials.createInsecure(),
      );
    }
  }

  get _client(): $FlowFixMe {
    return this.constructor._CLIENTS[this._port];
  }

  async wait(timeout: number): Promise<void> {
    await new Promise((resolve, reject) => {
      this._client.waitForReady(Date.now() + timeout, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  reset(): Promise<void> {
    return this._unary(this._client.reset);
  }

  getVersion(): Promise<string> {
    return this._unary(
      this._client.getVersion,
      {},
      response => response.version,
    );
  }

  getDebug(): Promise<DescribeTable> {
    return this._unary(this._client.getDebug, {}, response =>
      JSON.parse(response.debug),
    );
  }

  getAllPlugins(): Promise<Array<string>> {
    return this._unary(
      this._client.getAllPlugins,
      {},
      response => response.plugins,
    );
  }

  getPlugins$(): Observable<string> {
    return this._makeReadObservable(this._client.getPlugins()).pipe(
      map(response => response.plugin),
    );
  }

  getAllResources$(): Observable<AllResources> {
    return this._makeReadObservable(this._client.getAllResources()).pipe(
      map(response => JSON.parse(response.resources)),
    );
  }

  getResources$({
    plugin,
    resourceType,
    options,
  }: {|
    plugin: string,
    resourceType: string,
    options: Object,
  |}): Observable<Array<BaseResource>> {
    return this._makeReadObservable(this._client.getResources(), {
      plugin,
      resourceType,
      options: JSON.stringify(options),
    }).pipe(map(response => JSON.parse(response.resources)));
  }

  getResource$({
    plugin,
    resourceType,
    name,
    options,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
  |}): Observable<?BaseResource> {
    return this._makeReadObservable(this._client.getResource(), {
      plugin,
      resourceType,
      name,
      options: JSON.stringify(options),
    }).pipe(
      map(
        response =>
          response.resource === '' || response.resource == null
            ? null
            : JSON.parse(response.resource),
      ),
    );
  }

  getResource({
    plugin,
    resourceType,
    name,
    options,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
  |}): Promise<?BaseResource> {
    return this.getResource$({
      plugin,
      resourceType,
      name,
      options,
    })
      .pipe(take(1))
      .toPromise();
  }

  createResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse> {
    return this._makeCRUD({
      call: this._client.createResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  async createResource({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Promise<BaseResource> {
    const response = await this.createResource$({
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    }).toPromise();

    const error = getTasksError(response.tasks);
    if (error != null) {
      throw new Error(error);
    }

    const resource = await this.getResource({
      plugin,
      resourceType,
      name,
      options,
    });

    if (resource == null) {
      throw new Error(`Failed to find ${resourceType}: ${name}`);
    }
    return resource;
  }

  deleteResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse> {
    return this._makeCRUD({
      call: this._client.deleteResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  startResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse> {
    return this._makeCRUD({
      call: this._client.startResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  stopResource$({
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse> {
    return this._makeCRUD({
      call: this._client.stopResource(),
      plugin,
      resourceType,
      name,
      options,
      cancel$,
    });
  }

  _makeCRUD({
    call,
    plugin,
    resourceType,
    name,
    options,
    cancel$,
  }: {|
    call: any,
    plugin: string,
    resourceType: string,
    name: string,
    options: Object,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse> {
    return this._makeCancellable(
      call,
      {
        type: 'start',
        plugin,
        resourceType,
        name,
        options: JSON.stringify(options),
      },
      cancel$,
    ).pipe(map(response => ({ tasks: JSON.parse(response.tasks) })));
  }

  _makeCancellable(
    call: any,
    req: Object,
    cancel$: Observable<void>,
  ): Observable<any> {
    return this._makeObservable(call, () => {
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

  _makeReadObservable(call: any, req?: Object): Observable<Object> {
    const cancel$ = new Subject();
    return this._makeObservable(call, () => {
      call.write({ ...(req || {}), type: 'start' });
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
      filter(response => response.type !== 'aborted'),
      map(response => {
        if (response.type === 'error') {
          throw new ReadError(response.code, response.message);
        }

        return response.response;
      }),
    );
  }

  _makeObservable(call: any, start?: () => () => void): Observable<any> {
    return Observable.create(observer => {
      call.on('data', value => {
        observer.next(value);
      });
      call.on('error', error => {
        observer.error(error);
      });
      call.on('end', () => {
        observer.complete();
      });
      let destroy;
      if (start != null) {
        destroy = start();
      }
      return () => {
        if (destroy != null) {
          destroy();
        }
      };
    }).pipe(publishReplay(), refCount());
  }

  _unary<T>(
    func: (req: Object, cb: (err: Error, response: Object) => void) => void,
    req: Object = {},
    callback?: (response: Object) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) =>
      func.bind(this._client)(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(callback == null ? response : callback(response));
        }
      }),
    );
  }
}
