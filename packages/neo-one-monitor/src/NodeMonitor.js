/* @flow */
import Koa, { type Context } from 'koa';

import gcStats from 'prometheus-gc-stats';
import mount from 'koa-mount';
// $FlowFixMe
import perfHooks from 'perf_hooks';
import prom from 'prom-client';

import type {
  Counter,
  Gauge,
  Histogram,
  LogLevel,
  Monitor,
  Summary,
} from './types';
import MonitorBase, {
  type Logger,
  type MetricConstruct,
  type MetricLabels,
  type MetricsFactory,
  type RawLabels,
  type Tracer,
  convertMetricLabel,
  convertMetricLabels,
} from './MonitorBase';

class BaseMetric<TMetric: Object> {
  static MetricClass: Class<TMetric>;
  _metric: TMetric;
  _labels: RawLabels;

  constructor({ name, help, labelNames, labels }: MetricConstruct) {
    this._metric = new this.constructor.MetricClass({
      name,
      help: help == null ? 'Placeholder' : help,
      labelNames: (labelNames || []).map(labelName =>
        convertMetricLabel(labelName),
      ),
    });
    this._labels = labels;
  }

  _getArgs(
    valueOrLabels?: RawLabels | number,
    value?: number,
  ): [MetricLabels, number | void] {
    if (valueOrLabels == null || typeof valueOrLabels === 'number') {
      return [convertMetricLabels(this._labels), valueOrLabels];
    }

    return [convertMetricLabels({ ...this._labels, ...valueOrLabels }), value];
  }
}

class NodeCounter extends BaseMetric<prom.Counter> implements Counter {
  static MetricClass = prom.Counter;

  inc(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.inc(...this._getArgs(countOrLabels, count));
  }
}

class NodeGauge extends BaseMetric<prom.Gauge> implements Gauge {
  static MetricClass = prom.Gauge;

  inc(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.inc(...this._getArgs(countOrLabels, count));
  }

  dec(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.dec(...this._getArgs(countOrLabels, count));
  }

  set(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.set(...this._getArgs(countOrLabels, count));
  }
}

class NodeHistogram extends BaseMetric<prom.Histogram> implements Histogram {
  static MetricClass = prom.Histogram;

  observe(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.observe(...this._getArgs(countOrLabels, count));
  }
}

class NodeSummary extends BaseMetric<prom.Summary> implements Summary {
  static MetricClass = prom.Summary;

  observe(countOrLabels?: number | RawLabels, count?: number): void {
    this._metric.observe(...this._getArgs(countOrLabels, count));
  }
}

class NodeMetricsFactory implements MetricsFactory {
  createCounter(options: MetricConstruct): Counter {
    return new NodeCounter(options);
  }

  createGauge(options: MetricConstruct): Gauge {
    return new NodeGauge(options);
  }

  createHistogram(options: MetricConstruct): Histogram {
    return new NodeHistogram(options);
  }

  createSummary(options: MetricConstruct): Summary {
    return new NodeSummary(options);
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
      now: () => perfHooks.performance.now(),
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
