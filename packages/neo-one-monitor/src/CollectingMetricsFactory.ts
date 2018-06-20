import { CounterProxy, HistogramProxy, MetricsFactoryProxy } from './MetricsFactoryProxy';
import {
  BucketedMetricOptions,
  CollectedMetric,
  CollectedMetrics,
  Counter,
  CounterBase,
  Histogram,
  HistogramBase,
  Labels,
  MetricCollection,
  MetricOptions,
  MetricValue,
  PercentiledMetricOptions,
} from './types';

class CollectingMetric<T extends MetricOptions | BucketedMetricOptions> {
  public readonly metric: T;
  // tslint:disable-next-line readonly-keyword readonly-array
  protected mutableValues: MetricValue[];

  public constructor(metric: T) {
    this.metric = metric;
    this.mutableValues = [];
  }

  public toJSON(): CollectedMetric<T> {
    return { metric: this.metric, values: this.mutableValues };
  }

  public reset(): void {
    this.mutableValues = [];
  }
}

class CollectingCounter extends CollectingMetric<MetricOptions> implements CounterBase {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    this.mutableValues.push({ countOrLabels, count });
  }
}

class CollectingHistogram extends CollectingMetric<BucketedMetricOptions> implements HistogramBase {
  public observe(countOrLabels?: Labels | number, count?: number): void {
    // tslint:disable-next-line no-array-mutate
    this.mutableValues.push({ countOrLabels, count });
  }
}

export class CollectingMetricsFactory extends MetricsFactoryProxy {
  private mutableCollectingCounters: { [K in string]: CollectingCounter } = {};
  private mutableCollectingHistograms: { [K in string]: CollectingHistogram } = {};

  public collect(): MetricCollection {
    const currentMetrics = this.serializeJSON();
    Object.values(this.mutableCollectingCounters).forEach((metric) => metric.reset());
    Object.values(this.mutableCollectingHistograms).forEach((metric) => metric.reset());

    return currentMetrics;
  }

  public reset_forTest(): void {
    super.reset_forTest();
    this.mutableCollectingCounters = {};
    this.mutableCollectingHistograms = {};
  }

  protected createCounterInternal(options: MetricOptions): Counter {
    const counter = new CollectingCounter(options);
    this.mutableCollectingCounters[counter.metric.name] = counter;

    return this.initializeMetric(
      new CounterProxy(counter, options.labelNames),
      options,
      (metric) => metric.inc(0),
      (metric, labels) => metric.inc(labels, 0),
    );
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    const histogram = new CollectingHistogram(options);
    this.mutableCollectingHistograms[histogram.metric.name] = histogram;

    return this.initializeMetric(
      new HistogramProxy(histogram, options.labelNames),
      options,
      (metric) => metric.observe(0),
      (metric, labels) => metric.observe(labels, 0),
    );
  }

  private serializeJSON(): MetricCollection {
    return {
      counters: Object.entries(this.mutableCollectingCounters).reduce<CollectedMetrics<MetricOptions>>(
        (accMetric, [name, metric]) => ({
          ...accMetric,
          [name]: metric.toJSON(),
        }),
        {},
      ),
      histograms: Object.entries(this.mutableCollectingHistograms).reduce<CollectedMetrics<BucketedMetricOptions>>(
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
    { labelNames, labels = [] }: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
    init: (metric: T) => void,
    initLabels: (metric: T, labels: Labels) => void,
  ): T {
    if (labelNames === undefined) {
      init(metric);
    } else {
      labels.forEach((labelSet) => {
        initLabels(metric, labelSet);
      });
    }

    return metric;
  }
}

export const collectingMetrics = new CollectingMetricsFactory();
