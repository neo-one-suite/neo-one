import {
  Counter,
  Gauge,
  Histogram,
  Summary,
  Labels,
  MetricsFactory,
  MetricOptions,
  BucketedMetricOptions,
  PercentiledMetricOptions,
  CounterBase,
  GaugeBase,
  HistogramBase,
  SummaryBase,
} from './types';

import { convertMetricLabel, convertMetricLabels } from './utils';

export interface MetricConstruct {
  name: string;
  help: string;
  labelNames: string[];
  buckets?: number[];
  percentiles?: number[];
}

export class MetricProxy<T> {
  protected readonly metric: T | undefined;
  protected readonly labelNames: string[];

  constructor(metric?: T | undefined, labelNames: string[] = []) {
    this.metric = metric;
    this.labelNames = labelNames;
  }

  public getLabelNames(): string[] {
    return this.labelNames;
  }

  protected getLabels(countOrLabels?: Labels | number): Labels | number | void {
    if (countOrLabels != null && typeof countOrLabels === 'object') {
      return convertMetricLabels(countOrLabels);
    }

    return countOrLabels;
  }
}

export class CounterProxy extends MetricProxy<CounterBase> implements Counter {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.inc(this.getLabels(countOrLabels) as any, count);
    }
  }
}

export class GaugeProxy extends MetricProxy<GaugeBase> implements Gauge {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.inc(this.getLabels(countOrLabels) as any, count);
    }
  }

  public dec(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.dec(this.getLabels(countOrLabels) as any, count);
    }
  }

  public set(countOrLabels: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.set(this.getLabels(countOrLabels) as any, count as any);
    }
  }
}

export class HistogramProxy extends MetricProxy<HistogramBase>
  implements Histogram {
  public observe(countOrLabels: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.observe(this.getLabels(countOrLabels) as any, count as any);
    }
  }
}

export class SummaryProxy extends MetricProxy<SummaryBase> implements Summary {
  public observe(countOrLabels: Labels | number, count?: number): void {
    if (this.metric != null) {
      this.metric.observe(this.getLabels(countOrLabels) as any, count as any);
    }
  }
}

export class MetricsFactoryProxy implements MetricsFactory {
  private factory: MetricsFactory | undefined;

  public createCounter(options: MetricOptions): Counter {
    if (this.factory != null) {
      return this.factory.createCounter(options);
    }

    return this.createCounterInternal(options);
  }

  public createGauge(options: MetricOptions): Gauge {
    if (this.factory != null) {
      return this.factory.createGauge(options);
    }

    return this.createGaugeInternal(options);
  }

  public createHistogram(options: BucketedMetricOptions): Histogram {
    if (this.factory != null) {
      return this.factory.createHistogram(options);
    }

    return this.createHistogramInternal(options);
  }

  public createSummary(options: PercentiledMetricOptions): Summary {
    if (this.factory != null) {
      return this.factory.createSummary(options);
    }

    return this.createSummaryInternal(options);
  }

  public setFactory(factory: MetricsFactory): void {
    this.factory = factory;
  }

  protected createCounterInternal(options: MetricOptions): Counter {
    return new CounterProxy();
  }

  protected createGaugeInternal(options: MetricOptions): Gauge {
    return new GaugeProxy();
  }

  protected createHistogramInternal(options: BucketedMetricOptions): Histogram {
    return new HistogramProxy();
  }

  protected createSummaryInternal(options: PercentiledMetricOptions): Summary {
    return new SummaryProxy();
  }

  protected getMetricConstruct(
    options: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
  ): MetricConstruct {
    const {
      name,
      help = 'placeholder',
      labelNames: labelNamesIn = [],
    } = options;
    const labelNames = labelNamesIn.map((labelName) =>
      convertMetricLabel(labelName),
    );
    let construct: MetricConstruct = { name, help, labelNames };
    if ('percentiles' in options && options.percentiles != null) {
      construct = { name, help, labelNames, percentiles: options.percentiles };
    } else if ('buckets' in options && options.buckets != null) {
      construct = { name, help, labelNames, buckets: options.buckets };
    }

    return construct;
  }
}
