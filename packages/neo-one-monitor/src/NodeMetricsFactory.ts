import * as prom from 'prom-client';

import { CounterProxy, GaugeProxy, HistogramProxy, MetricsFactoryProxy, SummaryProxy } from './MetricsFactoryProxy';
import {
  BucketedMetricOptions,
  Counter,
  Gauge,
  Histogram,
  Labels,
  MetricOptions,
  MetricsFactory,
  PercentiledMetricOptions,
  Summary,
} from './types';

class NodeMetricsFactory extends MetricsFactoryProxy {
  protected createCounterInternal(options: MetricOptions): Counter {
    return new CounterProxy(
      this.initializeMetric(
        new prom.Counter(this.getMetricConstruct(options)),
        options,
        (metric: prom.Counter, labels: Labels) => metric.inc(labels as prom.labelValues, 0),
      ),
      options.labelNames,
    );
  }

  protected createGaugeInternal(options: MetricOptions): Gauge {
    return new GaugeProxy(
      this.initializeMetric(
        new prom.Gauge(this.getMetricConstruct(options)),
        options,
        (metric: prom.Gauge, labels: Labels) => metric.set(labels as prom.labelValues, 0),
      ),
      options.labelNames,
    );
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    return new HistogramProxy(
      this.initializeMetric(
        new prom.Histogram(this.getMetricConstruct(options)),
        options,
        (metric: prom.Histogram, labels: Labels) => metric.observe(labels as prom.labelValues, 0),
      ),
      options.labelNames,
    );
  }

  protected createSummaryInternal(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy(
      this.initializeMetric(
        new prom.Summary(this.getMetricConstruct(options)),
        options,
        (metric: prom.Summary, labels: Labels) => metric.observe(labels as prom.labelValues, 0),
      ),
      options.labelNames,
    );
  }

  protected initializeMetric<T>(
    metric: T,
    { labels = [] }: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
    init: (metric: T, labels: Labels) => void,
  ): T {
    labels.forEach((labelSet) => {
      // tslint:disable-next-line no-any
      init(metric, labelSet);
    });

    return metric;
  }
}

// tslint:disable-next-line export-name
export const nodeMetrics: MetricsFactory = new NodeMetricsFactory();
