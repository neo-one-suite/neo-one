import {
  CollectedMetric,
  Counter,
  Histogram,
  Labels,
  MetricCollection,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
  MetricValue,
  CounterBase,
  HistogramBase,
} from './types';
import {
  CounterProxy,
  HistogramProxy,
  MetricsFactoryProxy,
} from './MetricsFactoryProxy';

class CollectingMetric<T extends MetricOptions | BucketedMetricOptions> {
  public readonly metric: T;
  protected values: MetricValue[];

  constructor(metric: T) {
    this.metric = metric;
    this.values = [];
  }

  public toJSON(): CollectedMetric<T> {
    return { metric: this.metric, values: this.values };
  }

  public reset(): void {
    this.values = [];
  }
}

class CollectingCounter extends CollectingMetric<MetricOptions>
  implements CounterBase {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

class CollectingHistogram extends CollectingMetric<BucketedMetricOptions>
  implements HistogramBase {
  public observe(countOrLabels?: Labels | number, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class CollectingMetricsFactory extends MetricsFactoryProxy {
  private counters: { [name: string]: CollectingCounter } = {};
  private histograms: { [name: string]: CollectingHistogram } = {};

  public collect(): MetricCollection {
    const currentMetrics = this.serializeJSON();
    Object.values(this.counters).forEach((metric) => metric.reset());
    Object.values(this.histograms).forEach((metric) => metric.reset());

    return currentMetrics;
  }

  public reset_forTest(): void {
    this.counters = {};
    this.histograms = {};
  }

  protected createCounterInternal(options: MetricOptions): Counter {
    const counter = new CollectingCounter(options);
    this.counters[counter.metric.name] = counter;

    return this.initializeMetric(
      new CounterProxy(counter, options.labelNames),
      options,
      (metric) => metric.inc(0),
      (metric, labels) => metric.inc(labels, 0),
    );
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    const histogram = new CollectingHistogram(options);
    this.histograms[histogram.metric.name] = histogram;

    return this.initializeMetric(
      new HistogramProxy(histogram, options.labelNames),
      options,
      (metric) => metric.observe(0),
      (metric, labels) => metric.observe(labels, 0),
    );
  }

  private serializeJSON(): MetricCollection {
    return {
      counters: Object.entries(this.counters).reduce(
        (accMetric, [name, metric]) => ({
          ...accMetric,
          [name]: metric.toJSON(),
        }),
        {},
      ),
      histograms: Object.entries(this.histograms).reduce(
        (accMetric, [name, metric]) => ({
          ...accMetric,
          [name]: metric.toJSON(),
        }),
        {},
      ),
    };
  }

  private initializeMetric<T extends CounterBase | HistogramBase>(
    metric: T,
    {
      labelNames,
      labels = [],
    }: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
    init: (metric: T) => void,
    initLabels: (metric: T, labels: Labels) => void,
  ): T {
    if (labelNames == null) {
      init(metric);
    } else {
      for (const labelSet of labels) {
        initLabels(metric, labelSet);
      }
    }

    return metric;
  }
}

export const collectingMetrics: CollectingMetricsFactory = new CollectingMetricsFactory();
