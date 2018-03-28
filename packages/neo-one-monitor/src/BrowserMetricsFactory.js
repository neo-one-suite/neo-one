/* @flow */
import type { MetricConstruct, MetricsFactory, RawLabels } from './MonitorBase';

import type { Counter, Gauge, Histogram, Summary } from './types';

const metrics = {
  counters: [],
  histograms: [],
};

export const resetMetrics = (): void => {
  metrics.counters = [];
  metrics.histograms = [];
};

type MetricValue = {|
  countOrLabels?: number | RawLabels,
  count?: number,
|};

export class BaseMetric {
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
  counters: Array<BaseMetric>,
  histograms: Array<BaseMetric>,
|};

class BrowserCounter extends BaseMetric implements Counter {
  inc(countOrLabels?: number | RawLabels, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class BrowserGauge extends BaseMetric implements Gauge {
  // eslint-disable-next-line
  inc(countOrLabels?: number | RawLabels, count?: number): void {}

  // eslint-disable-next-line
  dec(countOrLabels?: number | RawLabels, count?: number): void {}

  // eslint-disable-next-line
  set(countOrLabels?: number | RawLabels, count?: number): void {}
}

class BrowserHistogram extends BaseMetric implements Histogram {
  observe(countOrLabels?: number | RawLabels, count?: number): void {
    this.values.push({ countOrLabels, count });
  }
}

export class BrowserSummary extends BaseMetric implements Summary {
  // eslint-disable-next-line
  observe(countOrLabels?: number | RawLabels, count?: number): void {}
}

interface MetricsFactoryCollect extends MetricsFactory {
  collect(): MetricCollection;
  _serializeJSON(inputJSON: Object): Object;
}

export default class BrowserMetricsFactory implements MetricsFactoryCollect {
  collect(): MetricCollection {
    const currentMetrics = this._serializeJSON(metrics);
    for (const metricType of Object.keys(metrics)) {
      metrics[metricType].map(metric => metric.reset());
    }
    return currentMetrics;
  }

  createGauge(options: MetricConstruct): Gauge {
    return new BrowserGauge(options);
  }

  createCounter(options: MetricConstruct): Counter {
    const counter = new BrowserCounter(options);
    metrics.counters.push(counter);

    return counter;
  }

  createHistogram(options: MetricConstruct): Histogram {
    const histogram = new BrowserHistogram(options);
    metrics.histograms.push(histogram);

    return histogram;
  }

  createSummary(options: MetricConstruct): Summary {
    return new BrowserSummary(options);
  }

  _serializeJSON(inputJSON: Object): Object {
    if (typeof inputJSON !== 'object') {
      return inputJSON;
    }

    const copy = {};
    for (const key of Object.keys(inputJSON)) {
      if (inputJSON[key] instanceof Array) {
        const arrCopy = [];
        inputJSON[key].map(elem => arrCopy.push(this._serializeJSON(elem)));
        copy[key] = arrCopy;
      } else if (inputJSON[key] != null && typeof inputJSON[key] === 'object') {
        copy[key] = this._serializeJSON(inputJSON[key]);
      } else {
        copy[key] = inputJSON[key];
      }
    }
    return copy;
  }
}
