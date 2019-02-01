import { IncomingMessage } from 'http';
import Application from 'koa';
import { Server } from 'net';

import mount from 'koa-mount';
import * as prom from 'prom-client';

import { MonitorBase, Tracer } from './MonitorBase';
import { Logger, LogLevel, Monitor } from './types';

export interface NodeMonitorCreate {
  readonly service: string;
  readonly logger?: Logger;
  readonly tracer?: Tracer;
  readonly spanLogLevel?: LogLevel;
}

const DEFAULT_LOGGER: Logger = {
  log: () => {
    // do nothing
  },
  close: (callback) => {
    callback();
  },
};

export class NodeMonitor extends MonitorBase {
  public static create({ service, logger = DEFAULT_LOGGER, tracer, spanLogLevel }: NodeMonitorCreate): NodeMonitor {
    prom.collectDefaultMetrics({ timeout: 4000 });

    return new NodeMonitor({
      service,
      component: service,
      logger,
      tracer,
      // Perfhooks is broken in 8.9 - there's no way to get the current
      // high resolution timestamp. Fix is in 9.8.0.
      now: () => Date.now(),
      spanLogLevel,
    });
  }

  private mutableServer: Server | undefined;

  public forContext(ctx: Application.Context): Monitor {
    return this.withLabels({
      [this.labels.HTTP_METHOD]: ctx.request.method,
      [this.labels.SPAN_KIND]: 'server',
      [this.labels.HTTP_REQUEST_PROTOCOL]: ctx.request.protocol,
    }).withData({
      [this.labels.HTTP_HEADERS]: JSON.stringify(ctx.request.headers),
      [this.labels.HTTP_URL]: ctx.request.originalUrl,
      [this.labels.HTTP_FULLPATH]: ctx.request.path,
      [this.labels.HTTP_REQUEST_QUERY]: ctx.request.querystring,
      [this.labels.PEER_ADDRESS]: ctx.request.ip,
      [this.labels.PEER_PORT]: ctx.request.socket.remotePort,
      [this.labels.HTTP_REQUEST_SIZE]: ctx.request.length,
    });
  }

  public forMessage(message: IncomingMessage): Monitor {
    const app = new Application();
    app.proxy = true;
    app.silent = true;
    // tslint:disable-next-line no-any
    const ctx = app.createContext(message, undefined as any);

    return this.forContext(ctx);
  }

  public serveMetrics(port: number): void {
    const app = new Application();
    app.proxy = true;
    app.silent = true;

    const monitor = this.at('telemetry');
    app.on('error', (error: Error) => {
      monitor.logError({
        name: 'http_server_request_uncaught_error',
        message: 'Unexpected uncaught request error.',
        error,
      });
    });

    app.use(
      mount('/metrics', (ctx: Application.Context) => {
        ctx.body = prom.register.metrics();
      }),
    );

    this.mutableServer = app.listen(port);
  }

  protected async closeInternal(): Promise<void> {
    clearInterval(prom.collectDefaultMetrics());
    await Promise.all([
      super.closeInternal(),
      new Promise<void>((resolve) => {
        if (this.mutableServer === undefined) {
          resolve();
        } else {
          this.mutableServer.close(resolve);
        }
      }),
    ]);
  }
}
