/* @flow */
import type {
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
} from './types';
import {
  CounterProxy,
  GaugeProxy,
  HistogramProxy,
  SummaryProxy,
  MetricsFactoryProxy,
} from './MetricsFactoryProxy';

class NoOpMetricsFactory extends MetricsFactoryProxy {
  // eslint-disable-next-line
  _createCounter(options: MetricOptions): Counter {
    return new CounterProxy();
  }

  // eslint-disable-next-line
  _createGauge(options: MetricOptions): Gauge {
    return new GaugeProxy();
  }

  // eslint-disable-next-line
  _createHistogram(options: BucketedMetricOptions): Histogram {
    return new HistogramProxy();
  }

  // eslint-disable-next-line
  _createSummary(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy();
  }
}

export default new NoOpMetricsFactory();
