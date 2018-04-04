/* @flow */
import Koa, { type Context } from 'koa';

import gcStats from 'prometheus-gc-stats';
import mount from 'koa-mount';
// $FlowFixMe
import perfHooks from 'perf_hooks';
import prom from 'prom-client';

import type { LogLevel, Monitor, MetricConstruct } from './types';
import MonitorBase, {
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type Logger,
  type MetricsFactory,
  type SummaryMetric,
  type Tracer,
} from './MonitorBase';

class NodeMetricsFactory implements MetricsFactory {
  createCounter(options: MetricConstruct): CounterMetric {
    return new prom.Counter(options);
  }

  createGauge(options: MetricConstruct): GaugeMetric {
    return new prom.Gauge(options);
  }

  createHistogram(options: MetricConstruct): HistogramMetric {
    return new prom.Histogram(options);
  }

  createSummary(options: MetricConstruct): SummaryMetric {
    return new prom.Summary(options);
  }
}

type NodeMonitorCreate = {|
  service: string,
  logger?: Logger,
  tracer?: Tracer,
  metricsLogLevel?: LogLevel,
  spanLogLevel?: LogLevel,
|};

export default class NodeMonitor extends MonitorBase {
  _server: ?net$Server = null;

  static create({
    service,
    logger,
    tracer,
    metricsLogLevel,
    spanLogLevel,
  }: NodeMonitorCreate): NodeMonitor {
    prom.collectDefaultMetrics({ timeout: 4000 });
    gcStats(prom.register)();
    return new NodeMonitor({
      service,
      component: service,
      logger: logger || {
        log: () => {},
        close: (callback: () => void) => {
          callback();
        },
      },
      tracer,
      metricsFactory: new NodeMetricsFactory(),
      now: () => perfHooks.performance.timeOrigin + perfHooks.performance.now(),
      metricsLogLevel,
      spanLogLevel,
    });
  }

  forContext(ctx: Context): Monitor {
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

  forMessage(message: http$IncomingMessage): Monitor {
    const app = new Koa();
    app.proxy = true;
    // $FlowFixMe
    app.silent = true;
    const ctx = ((app: $FlowFixMe).createContext(message, undefined): Context);
    return this.forContext(ctx);
  }

  serveMetrics(port: number): void {
    const app = new Koa();
    app.proxy = true;
    // $FlowFixMe
    app.silent = true;

    const monitor = this.at('telemetry');
    app.on('error', error => {
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

    this._server = app.listen(port);
  }

  async _closeInternal(): Promise<void> {
    clearInterval(prom.collectDefaultMetrics());
    await Promise.all([
      super._closeInternal(),
      new Promise(resolve => {
        if (this._server != null) {
          this._server.close(() => resolve());
        }
      }),
    ]);
  }
}
