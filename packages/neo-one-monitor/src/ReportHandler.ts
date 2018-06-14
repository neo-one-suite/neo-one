import { BucketedMetricOptions, Counter, Histogram, Logger, MetricOptions, Report } from './types';

import { metrics } from './NoOpMetricsFactory';

export class ReportHandler {
  private readonly mutableCounters: { [K in string]?: Counter } = {};
  private readonly mutableHistograms: { [K in string]?: Histogram } = {};

  public constructor(private readonly logger: Logger) {}

  public report(report: Report): void {
    report.logs.forEach((log) => {
      const { error } = log;
      let mutableErrorObj: Error | undefined;
      if (error !== undefined) {
        mutableErrorObj = new Error(error.message);
        if (error.stack !== undefined) {
          mutableErrorObj.stack = error.stack;
        }
        if (error.code !== undefined) {
          // tslint:disable-next-line no-object-mutation
          (mutableErrorObj as { code?: string }).code = error.code;
        }
      }
      this.logger.log({
        name: log.name,
        level: log.level,
        message: log.message,
        labels: log.labels,
        data: log.data,
        error: error === undefined ? undefined : mutableErrorObj,
      });
    });

    Object.values(report.metrics.counters).forEach((counterMetric) => {
      const counter = this.getCounter(counterMetric.metric);
      counterMetric.values.forEach((value) => {
        if (typeof value.countOrLabels === 'number') {
          counter.inc(value.countOrLabels);
        } else if (value.count !== undefined) {
          counter.inc(value.countOrLabels, value.count);
        } else {
          counter.inc(value.countOrLabels);
        }
      });
    });

    Object.values(report.metrics.histograms).forEach((histMetric) => {
      const histogram = this.getHistogram(histMetric.metric);
      histMetric.values.forEach((value) => {
        if (typeof value.countOrLabels === 'number') {
          histogram.observe(value.countOrLabels);
        } else if (value.countOrLabels !== undefined && value.count !== undefined) {
          histogram.observe(value.countOrLabels, value.count);
        }
      });
    });
  }

  private getCounter(options: MetricOptions): Counter {
    let counter = this.mutableCounters[options.name];
    if (counter === undefined) {
      counter = metrics.createCounter(options);
      this.mutableCounters[options.name] = counter;
    }

    return counter;
  }

  private getHistogram(options: BucketedMetricOptions): Histogram {
    let histogram = this.mutableHistograms[options.name];
    if (histogram === undefined) {
      histogram = metrics.createHistogram(options);
      this.mutableHistograms[options.name] = histogram;
    }

    return histogram;
  }
}
