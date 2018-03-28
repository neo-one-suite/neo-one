/* @flow */
import type { Counter, Gauge, Histogram, LogLevel, Summary } from './types';
import MonitorBase, {
  type Logger,
  type MetricConstruct,
  type MetricLabels,
  type MetricsFactory,
  type Tracer,
} from './MonitorBase';

class BaseMetric {
  // eslint-disable-next-line
  constructor(options: MetricConstruct) {}
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

class BrowserMetricsFactory implements MetricsFactory {
  createCounter(options: MetricConstruct): Counter {
    return new BrowserCounter(options);
  }

  createGauge(options: MetricConstruct): Gauge {
    return new BrowserGauge(options);
  }

  createHistogram(options: MetricConstruct): Histogram {
    return new BrowserHistogram(options);
  }

  createSummary(options: MetricConstruct): Summary {
    return new BrowserSummary(options);
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
    const perf = performance;
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
      now: () => perf.now(),
      metricsLogLevel,
      spanLogLevel,
    });
  }
}
