import {
  BucketedMetricOptions,
  Counter,
  CounterBase,
  Gauge,
  GaugeBase,
  Histogram,
  HistogramBase,
  Labels,
  MetricOptions,
  MetricsFactory,
  PercentiledMetricOptions,
  Summary,
  SummaryBase,
} from './types';

import { convertMetricLabel, convertMetricLabels } from './utils';

export interface MetricConstruct {
  readonly name: string;
  readonly help: string;
  // tslint:disable readonly-array
  readonly labelNames: string[];
  readonly buckets?: number[];
  readonly percentiles?: number[];
  // tslint:enable readonly-array
}

export class MetricProxy<T> {
  protected readonly metric: T | undefined;
  protected readonly labelNames: ReadonlyArray<string>;

  public constructor(metric?: T | undefined, labelNames: ReadonlyArray<string> = []) {
    this.metric = metric;
    this.labelNames = labelNames;
  }

  public getLabelNames(): ReadonlyArray<string> {
    return this.labelNames;
  }

  protected getLabels(countOrLabels?: Labels | number): Labels | number | void {
    if (countOrLabels !== undefined && typeof countOrLabels === 'object') {
      return convertMetricLabels(countOrLabels);
    }

    return countOrLabels;
  }
}

export class CounterProxy extends MetricProxy<CounterBase> implements Counter {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.inc(this.getLabels(countOrLabels) as Labels, count);
    }
  }
}

export class GaugeProxy extends MetricProxy<GaugeBase> implements Gauge {
  public inc(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.inc(this.getLabels(countOrLabels) as Labels, count);
    }
  }

  public dec(countOrLabels?: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.dec(this.getLabels(countOrLabels) as Labels, count);
    }
  }

  public set(countOrLabels: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.set(this.getLabels(countOrLabels) as Labels, count as number);
    }
  }
}

export class HistogramProxy extends MetricProxy<HistogramBase> implements Histogram {
  public observe(countOrLabels: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.observe(this.getLabels(countOrLabels) as Labels, count as number);
    }
  }
}

export class SummaryProxy extends MetricProxy<SummaryBase> implements Summary {
  public observe(countOrLabels: Labels | number, count?: number): void {
    if (this.metric !== undefined) {
      this.metric.observe(this.getLabels(countOrLabels) as Labels, count as number);
    }
  }
}

export class MetricsFactoryProxy implements MetricsFactory {
  private mutableFactory: MetricsFactory | undefined;

  public createCounter(options: MetricOptions): Counter {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createCounter(options);
    }

    return this.createCounterInternal(options);
  }

  public createGauge(options: MetricOptions): Gauge {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createGauge(options);
    }

    return this.createGaugeInternal(options);
  }

  public createHistogram(options: BucketedMetricOptions): Histogram {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createHistogram(options);
    }

    return this.createHistogramInternal(options);
  }

  public createSummary(options: PercentiledMetricOptions): Summary {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createSummary(options);
    }

    return this.createSummaryInternal(options);
  }

  public setFactory(mutableFactory: MetricsFactory): void {
    this.mutableFactory = mutableFactory;
  }

  protected createCounterInternal(_options: MetricOptions): Counter {
    return new CounterProxy();
  }

  protected createGaugeInternal(_options: MetricOptions): Gauge {
    return new GaugeProxy();
  }

  protected createHistogramInternal(_options: BucketedMetricOptions): Histogram {
    return new HistogramProxy();
  }

  protected createSummaryInternal(_options: PercentiledMetricOptions): Summary {
    return new SummaryProxy();
  }

  protected getMetricConstruct(
    options: MetricOptions | BucketedMetricOptions | PercentiledMetricOptions,
  ): MetricConstruct {
    const { name, help = 'placeholder', labelNames: labelNamesIn = [] } = options;
    const labelNames = labelNamesIn.map(convertMetricLabel);
    let construct: MetricConstruct = { name, help, labelNames };
    if ('percentiles' in options && options.percentiles !== undefined) {
      construct = { name, help, labelNames, percentiles: [...options.percentiles] };
    } else if ('buckets' in options && options.buckets !== undefined) {
      construct = { name, help, labelNames, buckets: [...options.buckets] };
    }

    return construct;
  }
}
