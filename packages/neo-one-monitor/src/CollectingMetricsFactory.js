/* @flow */
import { utils } from '@neo-one/utils';

import type {
  CollectedMetric,
  Counter,
  Gauge,
  Histogram,
  Summary,
  Labels,
  MetricCollection,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
  MetricValue,
} from './types';
import {
  CounterProxy,
  GaugeProxy,
  HistogramProxy,
  SummaryProxy,
  MetricsFactoryProxy,
} from './MetricsFactoryProxy';

export class CollectingMetric<T: MetricOptions | BucketedMetricOptions> {
  metric: T;
  values: Array<MetricValue>;

  constructor(metric: T) {
    this.metric = metric;
    this.values = [];
  }

  toJSON(): CollectedMetric<T> {
    return { metric: this.metric, values: this.values };
  }

  reset(): void {
    this.values = [];
  }
}

class CollectingCounter extends CollectingMetric<MetricOptions> {
  inc(countOrLabels?: Labels | number, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

class CollectingHistogram extends CollectingMetric<BucketedMetricOptions> {
  observe(countOrLabels?: Labels | number, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class CollectingMetricsFactory extends MetricsFactoryProxy {
  _counters: { [name: string]: CollectingCounter } = {};
  _histograms: { [name: string]: CollectingHistogram } = {};

  collect(): MetricCollection {
    const currentMetrics = this._serializeJSON();
    utils.values(this._counters).forEach(metric => metric.reset());
    utils.values(this._histograms).forEach(metric => metric.reset());

    return currentMetrics;
  }

  _createCounter(options: MetricOptions): Counter {
    const counter = new CollectingCounter(options);
    this._counters[counter.metric.name] = counter;

    return this._initializeMetric(
      new CounterProxy(counter, options.labelNames),
      options,
      metric => metric.inc(0),
      (metric, labels) => metric.inc(labels, 0),
    );
  }

  // eslint-disable-next-line
  _createGauge(options: MetricOptions): Gauge {
    return new GaugeProxy();
  }

  _createHistogram(options: BucketedMetricOptions): Histogram {
    const histogram = new CollectingHistogram(options);
    this._histograms[histogram.metric.name] = histogram;

    return this._initializeMetric(
      new HistogramProxy(histogram, options.labelNames),
      options,
      metric => metric.observe(0),
      (metric, labels) => metric.observe(labels, 0),
    );
  }

  // eslint-disable-next-line
  _createSummary(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy();
  }

  _serializeJSON(): MetricCollection {
    return {
      counters: utils.entries(this._counters).reduce(
        (accMetric, [name, metric]) => ({
          ...accMetric,
          [name]: metric.toJSON(),
        }),
        {},
      ),
      histograms: utils.entries(this._histograms).reduce(
        (accMetric, [name, metric]) => ({
          ...accMetric,
          [name]: metric.toJSON(),
        }),
        {},
      ),
    };
  }

  _initializeMetric<T: Counter | Histogram>(
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

  reset(): void {
    this._counters = {};
    this._histograms = {};
  }
}

export default new CollectingMetricsFactory();
