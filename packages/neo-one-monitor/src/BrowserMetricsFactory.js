/* @flow */
import { utils } from '@neo-one/utils';

import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  MetricsFactory,
  MetricLabels,
  SummaryMetric,
} from './MonitorBase';
import type {
  MetricCollection,
  MetricConstruct,
  MetricValue,
  CollectingMetricBase,
  CollectingMetricJSON,
} from './types';

let metrics = {
  counters: {},
  histograms: {},
};

export const resetMetricsForTesting = (): void => {
  metrics = {
    counters: {},
    histograms: {},
  };
};

export class CollectingMetric implements CollectingMetricBase {
  metric: MetricConstruct;
  values: Array<MetricValue>;

  constructor(metric: MetricConstruct) {
    this.metric = metric;
    this.values = [];
  }

  toJSON(): CollectingMetricJSON {
    return { metric: this.metric, values: this.values };
  }

  reset(): void {
    this.values = [];
  }
}

class BrowserCounter extends CollectingMetric implements CounterMetric {
  inc(labels?: MetricLabels, count?: number): void {
    this.values.push({ labels, count });
  }
}

export class BrowserGauge extends CollectingMetric implements GaugeMetric {
  // eslint-disable-next-line
  inc(labels?: MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  dec(labels?: MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  set(labels?: MetricLabels, count?: number): void {}
}

class BrowserHistogram extends CollectingMetric implements HistogramMetric {
  observe(labels?: MetricLabels, count?: number): void {
    this.values.push({ labels, count });
  }
}

export class BrowserSummary extends CollectingMetric implements SummaryMetric {
  // eslint-disable-next-line
  observe(labels?: MetricLabels, count?: number): void {}
}

export default class BrowserMetricsFactory implements MetricsFactory {
  collect(): MetricCollection {
    const currentMetrics = this._serializeJSON(metrics);
    utils
      .values(metrics)
      .forEach(innerMetrics =>
        utils.values(innerMetrics).forEach(metric => metric.reset()),
      );

    return currentMetrics;
  }

  createGauge(options: MetricConstruct): GaugeMetric {
    return new BrowserGauge(options);
  }

  createCounter(options: MetricConstruct): CounterMetric {
    const counter = new BrowserCounter(options);
    metrics.counters[counter.metric.name] = counter;

    return counter;
  }

  createHistogram(options: MetricConstruct): HistogramMetric {
    const histogram = new BrowserHistogram(options);
    metrics.histograms[histogram.metric.name] = histogram;

    return histogram;
  }

  createSummary(options: MetricConstruct): SummaryMetric {
    return new BrowserSummary(options);
  }

  _serializeJSON(currentMetrics: MetricCollection): MetricCollection {
    const copy = utils.entries(currentMetrics).reduce(
      (accMetricType, [metricType, metricsObj]) => ({
        ...accMetricType,
        [metricType]: utils.entries(metricsObj).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: metric.toJSON(),
          }),
          {},
        ),
      }),
      { counters: {}, histograms: {} },
    );

    return {
      counters: copy.counters,
      histograms: copy.histograms,
    };
  }
}
