/* @flow */
import { utils } from '@neo-one/utils';

import type {
  MetricsFactory,
  MetricLabels,
  MetricConstruct,
} from './MonitorBase';

import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
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

export type MetricValue = {|
  labels?: MetricLabels,
  count?: number,
|};

export class CollectingMetric {
  metric: MetricConstruct;
  values: Array<MetricValue>;

  constructor(metric: MetricConstruct) {
    this.metric = metric;
    this.values = [];
  }

  reset(): void {
    this.values = [];
  }
}

export type MetricCollection = {|
  counters: { [name: string]: CollectingMetric },
  histograms: { [name: string]: CollectingMetric },
|};

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
      .keys(metrics)
      .map(metricType =>
        utils
          .keys(metrics[metricType])
          .map(name => metrics[metricType][name].reset()),
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
    const copy = utils
      .keys(currentMetrics)
      .reduce((accMetricType, metricType) => {
        const resultMetricType = { ...accMetricType };
        resultMetricType[metricType] = utils
          .keys(currentMetrics[metricType])
          .reduce((accMetric, name) => {
            const result = { ...accMetric };
            const metric = {
              metric: {
                name: currentMetrics[metricType][name].metric.name,
                help: currentMetrics[metricType][name].metric.help,
                labelNames: [
                  ...currentMetrics[metricType][name].metric.labelNames,
                ],
              },
              values: currentMetrics[metricType][name].values.map(value => ({
                labels: { ...value.labels },
                count: value.count,
              })),
            };
            result[name] = metric;
            return result;
          }, {});
        return resultMetricType;
      }, {});

    return {
      counters: copy.counters,
      histograms: copy.histograms,
    };
  }
}
