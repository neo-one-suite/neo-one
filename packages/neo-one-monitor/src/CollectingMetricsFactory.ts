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

    return new CounterProxy(counter, options.labelNames);
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    const histogram = new CollectingHistogram(options);
    this.mutableCollectingHistograms[histogram.metric.name] = histogram;

    return new HistogramProxy(histogram, options.labelNames);
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
}

export const collectingMetrics = new CollectingMetricsFactory();
