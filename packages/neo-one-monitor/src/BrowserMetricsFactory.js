/* @flow */
import type {
  MetricsFactory,
  MetricLabels,
  MetricConstruct,
} from './MonitorBase';

import type { Counter, Gauge, Histogram, Summary } from './types';

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
  countOrLabels?: number | MetricLabels,
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

class BrowserCounter extends CollectingMetric implements Counter {
  inc(countOrLabels?: number | MetricLabels, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class BrowserGauge extends CollectingMetric implements Gauge {
  // eslint-disable-next-line
  inc(countOrLabels?: number | MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  dec(countOrLabels?: number | MetricLabels, count?: number): void {}

  // eslint-disable-next-line
  set(countOrLabels?: number | MetricLabels, count?: number): void {}
}

class BrowserHistogram extends CollectingMetric implements Histogram {
  observe(countOrLabels?: number | MetricLabels, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class BrowserSummary extends CollectingMetric implements Summary {
  // eslint-disable-next-line
  observe(countOrLabels?: number | MetricLabels, count?: number): void {}
}

export default class BrowserMetricsFactory implements MetricsFactory {
  collect(): MetricCollection {
    const currentMetrics = this._serializeJSON(metrics);
    for (const metricType of Object.keys(metrics)) {
      for (const name of Object.keys(metrics[metricType])) {
        metrics[metricType][name].reset();
      }
    }
    return currentMetrics;
  }

  createGauge(options: MetricConstruct): Gauge {
    return new BrowserGauge(options);
  }

  createCounter(options: MetricConstruct): Counter {
    const counter = new BrowserCounter(options);
    metrics.counters[counter.metric.name] = counter;

    return counter;
  }

  createHistogram(options: MetricConstruct): Histogram {
    const histogram = new BrowserHistogram(options);
    metrics.histograms[histogram.metric.name] = histogram;

    return histogram;
  }

  createSummary(options: MetricConstruct): Summary {
    return new BrowserSummary(options);
  }

  _serializeJSON(currentMetrics: MetricCollection): MetricCollection {
    const copy = {
      counters: {},
      histograms: {},
    };

    for (const metricType of Object.keys(currentMetrics)) {
      for (const name of Object.keys(currentMetrics[metricType])) {
        const metricCopy = {
          metric: {},
          values: [],
        };
        metricCopy.metric.name = currentMetrics[metricType][name].metric.name;
        metricCopy.metric.help = currentMetrics[metricType][name].metric.help;
        metricCopy.metric.labelNames = [];
        currentMetrics[metricType][name].metric.labelNames.map(label =>
          metricCopy.metric.labelNames.push(label),
        );
        metricCopy.values = [];
        currentMetrics[metricType][name].values.forEach(value => {
          let countOrLabelsCopy = value.countOrLabels;
          if (typeof value.countOrLabels === 'object') {
            countOrLabelsCopy = {};
            for (const label of Object.keys(value.countOrLabels)) {
              countOrLabelsCopy[label] = value.countOrLabels[label];
            }
          }
          metricCopy.values.push({
            countOrLabels: countOrLabelsCopy,
            count: value.count,
          });
        });
        copy[metricType][name] = metricCopy;
      }
    }
    return copy;
  }
}
