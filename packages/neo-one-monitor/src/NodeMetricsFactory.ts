import prom from 'prom-client';

import { CounterProxy, GaugeProxy, HistogramProxy, MetricsFactoryProxy, SummaryProxy } from './MetricsFactoryProxy';
import {
  BucketedMetricOptions,
  Counter,
  Gauge,
  Histogram,
  MetricOptions,
  MetricsFactory,
  PercentiledMetricOptions,
  Summary,
} from './types';

class NodeMetricsFactory extends MetricsFactoryProxy {
  protected createCounterInternal(options: MetricOptions): Counter {
    return new CounterProxy(
      this.initializeMetric(new prom.Counter(this.getMetricConstruct(options)), options, (metric: prom.Counter) =>
        metric.inc(0),
      ),
      options.labelNames,
    );
  }

  protected createGaugeInternal(options: MetricOptions): Gauge {
    return new GaugeProxy(
      this.initializeMetric(new prom.Gauge(this.getMetricConstruct(options)), options, (metric: prom.Gauge) =>
        metric.set(0),
      ),
      options.labelNames,
    );
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    return new HistogramProxy(
      this.initializeMetric(new prom.Histogram(this.getMetricConstruct(options)), options, (metric: prom.Histogram) =>
        metric.observe(0),
      ),
      options.labelNames,
    );
  }

  protected createSummaryInternal(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy(
      this.initializeMetric(new prom.Summary(this.getMetricConstruct(options)), options, (metric: prom.Summary) =>
        metric.observe(0),
      ),
      options.labelNames,
    );
  }

  protected initializeMetric<T>(
    metric: T,
    { labels = [] }: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
    init: (metric: T) => void,
  ): T {
    labels.forEach((labelSet) => {
      // tslint:disable-next-line no-any
      init((metric as any).labels(labelSet as any));
    });

    return metric;
  }
}

// tslint:disable-next-line export-name
export const nodeMetrics: MetricsFactory = new NodeMetricsFactory();
