import { httpLogger } from '@neo-one/logger';
import { finalize, Labels, mergeScanLatest } from '@neo-one/utils';
import * as http from 'http';
import * as https from 'https';
import Application from 'koa';
import { combineLatest, defer, Observable } from 'rxjs';

type ListenOptions =
  | {
      readonly port: number;
      readonly host: string;
    }
  | {
      readonly key: string;
      readonly cert: string;
      readonly port: number;
      readonly host: string;
    };

type Listener = (request: http.IncomingMessage, response: http.ServerResponse) => void;

interface HandleServerResult<T extends http.Server | https.Server> {
  readonly server: T | undefined;
  readonly listener: Listener | undefined;
  readonly app: Application | undefined;
}

async function handleServer<T extends http.Server | https.Server, TOptions extends ListenOptions>({
  createServer,
  keepAliveTimeout,
  options,
  app,
  prevResult: { app: prevApp, listener: prevListener, server: prevServer } = {
    app: undefined,
    listener: undefined,
    server: undefined,
  },
}: {
  readonly createServer: (options: TOptions) => T;
  readonly keepAliveTimeout: number;
  readonly options: TOptions;
  readonly app: Application;
  readonly prevResult: HandleServerResult<T> | undefined;
}): Promise<HandleServerResult<T>> {
  let server = prevServer;
  let listener = prevListener;
  if (options !== undefined) {
    const startServer = server === undefined;
    const safeServer = server === undefined ? createServer(options) : server;
    server = safeServer;

    if (app !== prevApp || prevListener === undefined) {
      if (prevListener !== undefined) {
        server.removeListener('request', prevListener);
      }

      listener = app.callback();
      server.on('request', listener);
    }

    // tslint:disable-next-line no-object-mutation
    server.keepAliveTimeout = keepAliveTimeout;

    if (startServer) {
      const { host, port } = options;
      await new Promise<void>((resolve) => safeServer.listen(port, host, 511, resolve));

      httpLogger.debug({ [Labels.SPAN_KIND]: 'server', title: 'server_listen' }, `Server listening on ${host}:${port}`);
    }
  }

  return { server, listener, app };
}

const finalizeServer = async (result: HandleServerResult<http.Server | https.Server> | undefined) => {
  if (result !== undefined && result.server !== undefined) {
    const { server } = result;
    await new Promise<void>((resolve, reject) => {
      server.close(reject);
      resolve();
    });
  }
};

// tslint:disable-next-line export-name
export function createServer$<T extends http.Server | https.Server, TOptions extends ListenOptions>(
  app$: Observable<Application>,
  keepAliveTimeout$: Observable<number | undefined>,
  options: TOptions,
  createServer: (options: TOptions) => T,
) {
  return combineLatest([app$, keepAliveTimeout$]).pipe(
    mergeScanLatest<[Application, number | undefined], HandleServerResult<T> | undefined>(
      (prevResult, [app, keepAliveTimeout]) =>
        defer(async () =>
          handleServer({
            createServer,
            keepAliveTimeout: keepAliveTimeout === undefined ? 60000 : keepAliveTimeout,
            options,
            app,
            prevResult,
          }),
        ),
      undefined,
    ),
    finalize<HandleServerResult<T> | undefined>(finalizeServer),
  );
}
