/* @flow */
import { interval } from 'rxjs/observable/interval';
// $FlowFixMe
import perfHooks from 'perf_hooks';

import type {
  Counter,
  Gauge,
  Histogram,
  LogLevel,
  LoggerLogOptions,
  Summary,
  Report,
} from './types';

import MonitorBase, {
  type Logger,
  type MetricConstruct,
  type MetricLabels,
  type MetricsFactory,
  type Tracer,
} from './MonitorBase';

const MAX_BACKLOG = 1000;

class BaseMetric {
  metric: MetricConstruct;
  values: Array<Object>;

  constructor(metric: MetricConstruct) {
    this.metric = metric;
    this.values = [];
  }

  reset(): void {
    this.values = [];
  }
}

class BrowserCounter extends BaseMetric implements Counter {
  // eslint-disable-next-line
  inc(countOrLabels?: number | MetricLabels, count?: number): void {}
}

class BrowserGauge extends BaseMetric implements Gauge {
  // eslint-disable-next-line
  inc(countOrLabels?: number | MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  dec(countOrLabels?: number | MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  set(countOrLabels?: number | MetricLabels, count?: number): void {}
}

class BrowserHistogram extends BaseMetric implements Histogram {
  // eslint-disable-next-line
  observe(countOrLabels?: number | MetricLabels, count?: number): void {}
}

class BrowserSummary extends BaseMetric implements Summary {
  // eslint-disable-next-line
  observe(countOrLabels?: number | MetricLabels, count?: number): void {}
}

interface MetricsFactoryCollect extends MetricsFactory {
  collect(): Object;
}

type MetricCollection = {|
  counters: Array<BaseMetric>,
  gauges: Array<BaseMetric>,
  histograms: Array<BaseMetric>,
  summaries: Array<BaseMetric>,
|};

class BrowserMetricsFactory implements MetricsFactoryCollect {
  _metrics: MetricCollection;

  constructor() {
    this._metrics = {
      counters: [],
      gauges: [],
      histograms: [],
      summaries: [],
    };
  }

  collect(): MetricCollection {
    const metrics = JSON.parse(JSON.stringify(this._metrics));
    for (const metricType of Object.keys(this._metrics)) {
      this._metrics[metricType].map(metric => metric.reset());
    }

    return metrics;
  }

  createCounter(options: MetricConstruct): Counter {
    const counter = new BrowserCounter(options);
    this._metrics.counters.push(counter);

    return counter;
  }

  createGauge(options: MetricConstruct): Gauge {
    const gauge = new BrowserGauge(options);
    this._metrics.gauges.push(gauge);

    return gauge;
  }

  createHistogram(options: MetricConstruct): Histogram {
    const histogram = new BrowserHistogram(options);
    this._metrics.histograms.push(histogram);

    return histogram;
  }

  createSummary(options: MetricConstruct): Summary {
    const summary = new BrowserSummary(options);
    this._metrics.summaries.push(summary);

    return summary;
  }
}

interface LoggerCollect extends Logger {
  collect(): Array<LoggerLogOptions>;
}

export class BrowserLogger implements LoggerCollect {
  _logs: Array<LoggerLogOptions>;

  constructor() {
    this._logs = [];
  }

  log(options: LoggerLogOptions): void {
    this._logs.push(options);
  }

  collect(): Array<LoggerLogOptions> {
    const logs = this._logs;
    this._logs = [];

    return logs;
  }

  close(callback: () => void): void {
    callback();
  }
}

export class Reporter {
  _logger: BrowserLogger;
  _monitor: BrowserMonitor;
  _timer: number;
  _endpoint: string;
  _backLogs: Array<LoggerLogOptions>;
  _backMetrics: MetricCollection;
  _shutdownFunc: () => void;

  constructor({
    logger,
    monitor,
    timer,
    endpoint,
  }: {|
    logger: BrowserLogger,
    monitor: BrowserMonitor,
    timer: number,
    endpoint: string,
  |}) {
    this._logger = logger;
    this._monitor = monitor;
    this._timer = timer;
    this._endpoint = endpoint;
    this._backLogs = [];
    this._backMetrics = {
      counters: [],
      gauges: [],
      histograms: [],
      summaries: [],
    };

    const subscription = interval(this._timer).subscribe(async () => {
      let logs = this._logger.collect();
      const metrics = this._monitor.collect();

      if (this._backLogs.length > 0) {
        logs = logs.concat(this._backLogs);
        this._backLogs = [];

        for (const metricType of Object.keys(metrics)) {
          for (const metric of metrics[metricType]) {
            const index = this._backMetrics[metricType].findIndex(
              val => val.metric.name === metric.metric.name,
            );

            if (index !== -1) {
              metric.values = metric.values.concat(
                this._backMetrics[metricType][index].values,
              );
              this._backMetrics[metricType].splice(index, 1);
            }
          }
          metrics[metricType] = metrics[metricType].concat(
            this._backMetrics[metricType],
          );
        }
        this._backMetrics = {
          counters: [],
          gauges: [],
          histograms: [],
          summaries: [],
        };
      }

      const response = await this._report({ logs, metrics });
      if (!response.ok) {
        this._backLogs = logs.slice(0, MAX_BACKLOG);
        for (const metricType of Object.keys(metrics)) {
          this._backMetrics[metricType] = metrics[metricType].slice(
            0,
            MAX_BACKLOG,
          );
        }
      }
    });

    this._shutdownFunc = () => subscription.unsubscribe();
  }

  async _report(report: Report): Promise<Response> {
    return fetch(this._endpoint, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  close(): void {
    this._shutdownFunc();
  }
}

type BrowserMonitorCreate = {|
  service: string,
  logger?: Logger,
  tracer?: Tracer,
  metricsLogLevel?: LogLevel,
  spanLogLevel?: LogLevel,
|};

export default class BrowserMonitor extends MonitorBase {
  static create({
    service,
    logger,
    tracer,
    metricsLogLevel,
    spanLogLevel,
  }: BrowserMonitorCreate): BrowserMonitor {
    return new BrowserMonitor({
      service,
      component: service,
      logger: logger || {
        log: () => {},
        close: (callback: () => void) => {
          callback();
        },
      },
      tracer,
      metricsFactory: new BrowserMetricsFactory(),
      // NOTE: We do not use performance.now because there is no longer a
      //       benefit in browsers with result rounding.
      now: () => Date.now(),
      metricsLogLevel,
      spanLogLevel,
    });
  }

  collect(): MetricCollection {
    // $FlowFixMe
    return this._metricsFactory.collect();
  }
}
