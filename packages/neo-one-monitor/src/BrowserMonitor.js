/* @flow */
import type { LogLevel, MetricConstruct } from './types';
import MonitorBase, {
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type Logger,
  type MetricLabels,
  type MetricsFactory,
  type SummaryMetric,
  type Tracer,
} from './MonitorBase';

class BaseMetric {
  // eslint-disable-next-line
  constructor(options: MetricConstruct) {}
}

class BrowserCounter extends BaseMetric implements CounterMetric {
  // eslint-disable-next-line
  inc(countOrLabels?: MetricLabels, count?: number): void {}
}

class BrowserGauge extends BaseMetric implements GaugeMetric {
  // eslint-disable-next-line
  inc(countOrLabels?: MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  dec(countOrLabels?: MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  set(countOrLabels?: MetricLabels, count?: number): void {}
}

class BrowserHistogram extends BaseMetric implements HistogramMetric {
  // eslint-disable-next-line
  observe(countOrLabels?: MetricLabels, count?: number): void {}
}

class BrowserSummary extends BaseMetric implements SummaryMetric {
  // eslint-disable-next-line
  observe(countOrLabels: MetricLabels, count?: number): void {}
}

class BrowserMetricsFactory implements MetricsFactory {
  createCounter(options: MetricConstruct): CounterMetric {
    return new BrowserCounter(options);
  }

  createGauge(options: MetricConstruct): GaugeMetric {
    return new BrowserGauge(options);
  }

  createHistogram(options: MetricConstruct): HistogramMetric {
    return new BrowserHistogram(options);
  }

  createSummary(options: MetricConstruct): SummaryMetric {
    return new BrowserSummary(options);
  }
}

type BrowserMonitorCreate = {|
  service: string,
  logger?: Logger,
  metricsFactory?: MetricsFactory,
  tracer?: Tracer,
  metricsLogLevel?: LogLevel,
  spanLogLevel?: LogLevel,
|};

export default class BrowserMonitor extends MonitorBase {
  static create({
    service,
    logger,
    metricsFactory,
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
      metricsFactory: metricsFactory || new BrowserMetricsFactory(),
      // NOTE: We do not use performance.now because there is no longer a
      //       benefit in browsers with result rounding.
      now: () => Date.now(),
      metricsLogLevel,
      spanLogLevel,
    });
  }
}
