/* @flow */
import prom from 'prom-client';

import type {
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
  Labels,
} from './types';
import {
  CounterProxy,
  GaugeProxy,
  HistogramProxy,
  SummaryProxy,
  MetricsFactoryProxy,
} from './MetricsFactoryProxy';

interface Metric {
  labels(labels: Labels): Metric;
}

class NodeMetricsFactory extends MetricsFactoryProxy {
  _createCounter(options: MetricOptions): Counter {
    return new CounterProxy(
      this._initializeMetric(
        new prom.Counter(this._getMetricConstruct(options)),
        options,
        metric => metric.inc(0),
      ),
      options.labelNames,
    );
  }

  _createGauge(options: MetricOptions): Gauge {
    return new GaugeProxy(
      this._initializeMetric(
        new prom.Gauge(this._getMetricConstruct(options)),
        options,
        metric => metric.set(0),
      ),
      options.labelNames,
    );
  }

  _createHistogram(options: BucketedMetricOptions): Histogram {
    return new HistogramProxy(
      this._initializeMetric(
        new prom.Histogram(this._getMetricConstruct(options)),
        options,
        metric => metric.observe(0),
      ),
      options.labelNames,
    );
  }

  _createSummary(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy(
      this._initializeMetric(
        new prom.Summary(this._getMetricConstruct(options)),
        options,
        metric => metric.observe(0),
      ),
      options.labelNames,
    );
  }

  _initializeMetric<T: Metric>(
    metric: T,
    {
      labels = [],
    }: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
    init: (metric: T) => void,
  ): T {
    for (const labelSet of labels) {
      init(metric.labels(labelSet));
    }

    return metric;
  }
}

export default new NodeMetricsFactory();
