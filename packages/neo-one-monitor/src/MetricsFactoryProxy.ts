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
  protected readonly labelNames: readonly string[];

  public constructor(metric?: T | undefined, labelNames: readonly string[] = []) {
    this.metric = metric;
    this.labelNames = labelNames;
  }

  public getLabelNames(): readonly string[] {
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
  protected mutableCounters: { [K in string]?: Counter } = {};
  protected mutableHistograms: { [K in string]?: Histogram } = {};
  protected mutableGauges: { [K in string]?: Gauge } = {};
  protected mutableSummaries: { [K in string]?: Summary } = {};

  private mutableFactory: MetricsFactory | undefined;

  public reset_forTest(): void {
    this.mutableCounters = {};
    this.mutableHistograms = {};
    this.mutableGauges = {};
    this.mutableSummaries = {};
  }

  public createCounter(options: MetricOptions): Counter {
    let counter = this.mutableCounters[options.name];
    if (counter === undefined) {
      counter = this.createCounterHelper(options);
      this.mutableCounters[options.name] = counter;
    }

    return counter;
  }

  public createGauge(options: MetricOptions): Gauge {
    let gauge = this.mutableGauges[options.name];
    if (gauge === undefined) {
      gauge = this.createGaugeHelper(options);
      this.mutableGauges[options.name] = gauge;
    }

    return gauge;
  }

  public createHistogram(options: MetricOptions): Histogram {
    let histogram = this.mutableHistograms[options.name];
    if (histogram === undefined) {
      histogram = this.createHistogramHelper(options);
      this.mutableHistograms[options.name] = histogram;
    }

    return histogram;
  }

  public createSummary(options: MetricOptions): Summary {
    let summary = this.mutableSummaries[options.name];
    if (summary === undefined) {
      summary = this.createSummaryHelper(options);
      this.mutableSummaries[options.name] = summary;
    }

    return summary;
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

  private createCounterHelper(options: MetricOptions): Counter {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createCounter(options);
    }

    return this.createCounterInternal(options);
  }

  private createGaugeHelper(options: MetricOptions): Gauge {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createGauge(options);
    }

    return this.createGaugeInternal(options);
  }

  private createHistogramHelper(options: BucketedMetricOptions): Histogram {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createHistogram(options);
    }

    return this.createHistogramInternal(options);
  }

  private createSummaryHelper(options: PercentiledMetricOptions): Summary {
    if (this.mutableFactory !== undefined) {
      return this.mutableFactory.createSummary(options);
    }

    return this.createSummaryInternal(options);
  }
}
