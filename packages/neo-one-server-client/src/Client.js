/* @flow */
// flowlint untyped-import:off
// flowlint unclear-type:off
import type {
  AllResources,
  BaseResource,
  DescribeTable,
  ModifyResourceResponse,
} from '@neo-one/server-plugin';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { filter, map, publishReplay, refCount } from 'rxjs/operators';
import grpc from 'grpc';
import proto from '@neo-one/server-grpc';

import { ReadError } from './errors';

import pkg from '../package.json';

const { Server } = grpc.load(proto);

export default class Client {
  static _CLIENTS = {};

  _port: number;
  version: string;

  constructor({ port, forceNew }: {| port: number, forceNew?: boolean |}) {
    this._port = port;
    this.version = pkg.version;

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
    ).pipe(
      map(response => {
        if (response.options != null && response.options !== '') {
          return { ...response, options: JSON.parse(response.options) };
        }

        return response;
      }),
    );
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
    req: Object,
    callback: (response: Object) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) =>
      func.bind(this._client)(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(callback(response));
        }
      }),
    );
  }
}
