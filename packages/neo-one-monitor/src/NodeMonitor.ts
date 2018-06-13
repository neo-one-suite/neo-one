import { IncomingMessage } from 'http';
import Koa, { Context } from 'koa';
import { Server } from 'net';

import mount from 'koa-mount';
import prom from 'prom-client';
import gcStats from 'prometheus-gc-stats';

import { MonitorBase, Tracer } from './MonitorBase';
import { Logger, LogLevel, Monitor } from './types';

export interface NodeMonitorCreate {
  service: string;
  logger?: Logger;
  tracer?: Tracer;
  spanLogLevel?: LogLevel;
}

export class NodeMonitor extends MonitorBase {
  public static create({
    service,
    logger,
    tracer,
    spanLogLevel,
  }: NodeMonitorCreate): NodeMonitor {
    prom.collectDefaultMetrics({ timeout: 4000 });
    gcStats(prom.register)();
    return new NodeMonitor({
      service,
      component: service,
      logger: logger || {
        log: () => {
          // do nothing
        },
        close: (callback: () => void) => {
          callback();
        },
      },
      tracer,
      // Perfhooks is broken in 8.9 - there's no way to get the current
      // high resolution timestamp. Fix is in 9.8.0.
      now: () => Date.now(),
      spanLogLevel,
    });
  }

  private server: Server | null = null;

  public forContext(ctx: Context): Monitor {
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
    const app = new Koa();
    app.proxy = true;
    // $FlowFixMe
    app.silent = true;
    const ctx = app.createContext(message, undefined as any);
    return this.forContext(ctx);
  }

  public serveMetrics(port: number): void {
    const app = new Koa();
    app.proxy = true;
    // $FlowFixMe
    app.silent = true;

    const monitor = this.at('telemetry');
    app.on('error', (error) => {
      monitor.logError({
        name: 'http_server_request_uncaught_error',
        message: 'Unexpected uncaught request error.',
        error,
      });
    });

    app.use(
      mount('/metrics', (ctx: Context) => {
        ctx.body = prom.register.metrics();
      }),
    );

    this.server = app.listen(port);
  }

  protected async closeInternal(): Promise<void> {
    clearInterval(prom.collectDefaultMetrics());
    await Promise.all([
      super.closeInternal(),
      new Promise((resolve) => {
        if (this.server == null) {
          resolve();
        } else {
          this.server.close(() => resolve());
        }
      }),
    ]);
  }
}
