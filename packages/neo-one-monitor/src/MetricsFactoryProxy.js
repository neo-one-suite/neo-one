/* @flow */
import type {
  Counter,
  Gauge,
  Histogram,
  Summary,
  Labels,
  MetricsFactory,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
} from './types';

import { convertMetricLabel, convertMetricLabels } from './utils';

export type MetricConstruct = {|
  name: string,
  help: string,
  labelNames: Array<string>,
  buckets?: Array<number>,
  percentiles?: Array<number>,
|};

class MetricProxy {
  metric: $FlowFixMe;
  labelNames: Array<string>;

  constructor(metric?: $FlowFixMe, labelNames?: Array<string> = []) {
    this.metric = metric;
    this.labelNames = labelNames;
  }

  getLabelNames(): Array<string> {
    return this.labelNames;
  }

  _getLabels(countOrLabels?: Labels | number): Labels | number | void {
    if (countOrLabels != null && typeof countOrLabels === 'object') {
      return convertMetricLabels(countOrLabels);
    }

    return countOrLabels;
  }
}

export class CounterProxy extends MetricProxy implements Counter {
  inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.inc(countOrLabels, count);
    }
  }
}

export class GaugeProxy extends MetricProxy implements Gauge {
  inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.inc(countOrLabels, count);
    }
  }

  dec(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.dec(countOrLabels, count);
    }
  }

  set(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.set(countOrLabels, count);
    }
  }
}

export class HistogramProxy extends MetricProxy implements Histogram {
  observe(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.observe(countOrLabels, count);
    }
  }
}

export class SummaryProxy extends MetricProxy implements Summary {
  observe(countOrLabels: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.observe(countOrLabels, count);
    }
  }
}

export class MetricsFactoryProxy implements MetricsFactory {
  _factory: ?MetricsFactory;

  createCounter(options: MetricOptions): Counter {
    if (this._factory != null) {
      return this._factory.createCounter(options);
    }

    return this._createCounter(options);
  }

  createGauge(options: MetricOptions): Gauge {
    if (this._factory != null) {
      return this._factory.createGauge(options);
    }

    return this._createGauge(options);
  }

  createHistogram(options: BucketedMetricOptions): Histogram {
    if (this._factory != null) {
      return this._factory.createHistogram(options);
    }

    return this._createHistogram(options);
  }

  createSummary(options: PercentiledMetricOptions): Summary {
    if (this._factory != null) {
      return this._factory.createSummary(options);
    }

    return this._createSummary(options);
  }

  setFactory(factory: MetricsFactory): void {
    this._factory = factory;
  }

  // eslint-disable-next-line
  _createCounter(options: MetricOptions): Counter {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  _createGauge(options: MetricOptions): Gauge {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  _createHistogram(options: BucketedMetricOptions): Histogram {
    throw new Error('Not Implemented');
  }

  // eslint-disable-next-line
  _createSummary(options: PercentiledMetricOptions): Summary {
    throw new Error('Not Implemented');
  }

  _getMetricConstruct(
    options: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
  ): MetricConstruct {
    const {
      name,
      help = 'placeholder',
      labelNames: labelNamesIn = [],
    } = options;
    const labelNames = labelNamesIn.map(labelName =>
      convertMetricLabel(labelName),
    );
    let construct = { name, help, labelNames };
    if (options.percentiles) {
      construct = { name, help, labelNames, percentiles: options.percentiles };
    } else if (options.buckets) {
      construct = { name, help, labelNames, buckets: options.buckets };
    }

    return construct;
  }
}
